#!/bin/python
# -*- coding: utf-8 -*-

from . import shpUtils
from os.path import dirname
from struct import unpack

from osgeo import gdal
#from osgeo import ogr
#from osgeo import osr
#from osgeo import gdal_array
from osgeo.gdalconst import *


class Tile(object):
    def __init__(self, minX, minY, maxX, maxY, filename):
        self.minX = minX
        self.minY = minY
        self.maxX = maxX
        self.maxY = maxY
        self.filename = filename

    def contains(self, x, y):
        return self.minX <= x and self.maxX > x and self.minY <= y and self.maxY > y

    def __str__(self):
        return "%f, %f, %f, %f: %s" % (self.minX, self.minY, self.maxX, self.maxY, self.filename)


class BTTile(Tile):
    def getVal(self, x, y):
        file = open(self.filename, 'rb')
        if not hasattr(self, 'cols'):
            file.seek(10)
            (self.cols, self.rows, self.dataSize, self.floatingPoint) = unpack('<LLhh', file.read(12))
            self.resolutionX = (self.maxX-self.minX) / self.cols
            self.resolutionY = (self.maxY-self.minY) / self.rows

        posX = int((x-self.minX) / self.resolutionX)
        posY = int((y-self.minY) / self.resolutionY)
        file.seek(256 + (posY + posX * self.rows) * self.dataSize)
        if self.floatingPoint == 1:
          val = unpack("<f", file.read(self.dataSize))[0]
        else:
          if self.dataSize==2:
              format="<h"
          else:
              format="<l"
          val = unpack(format, file.read(self.dataSize))[0]

        file.close();
        return val

class TIFTile(Tile):
    def __init__(self, filename):
        self.dataset = gdal.Open(filename, GA_ReadOnly)
        self.adfGeoTransform = self.dataset.GetGeoTransform();
#        print (self.dataset.GetProjection())
#        print self.adfGeoTransform
        
        self.resolutionX = self.adfGeoTransform[1]
        self.resolutionY = self.adfGeoTransform[5]
        
        super(TIFTile, self).__init__(self.adfGeoTransform[0], self.adfGeoTransform[3], 
                self.adfGeoTransform[0] + self.dataset.RasterXSize * self.adfGeoTransform[1],
                self.adfGeoTransform[3] + self.dataset.RasterYSize * self.adfGeoTransform[5], filename)

    def getVal(self, x, y):
        posX = int((x - self.minX) / self.resolutionX)
        posY = int((y - self.minY) / self.resolutionY)

#        print "%f, %f (%f, %f - %f, %f) -> %i, %i"%(x, y, self.minX, self.minY, self.resolutionX, self.resolutionY, posX , posY)
        band = self.dataset.GetRasterBand(1)
        scanline = band.ReadRaster(posX, posY, 1, 1, 1, 1, GDT_Float32);
        tupleOfFloats = unpack('f' * 1, scanline)
        return tupleOfFloats[0]


class GeoRaster:
    def __init__(self, shapefileName):
        self.tiles=[]
        shpRecords = shpUtils.loadShapefile(shapefileName)
        dir=dirname(shapefileName)
        if dir == "":
            dir = "."
        for shape in shpRecords:
            filename=shape['dbf_data']['location'].rstrip()
            if filename.endswith(".tif"):
                tile = TIFTile(filename)
            else:
                tileClass=None
                if filename.endswith(".bt"):
                    tileClass = BTTile
                if not filename.startswith("/"):
                    filename = dir + '/' + filename
                geo = shape['shp_data']
                tile = tileClass(geo['xmin'], geo['ymin'], geo['xmax'], geo['ymax'], filename)
            
            self.tiles.append(tile)

    def getVal(self, x,y):
        tile=self.getTile(x, y)
        if tile:
            return tile.getVal(x, y)
        else:
            return None

        #private
    def getTile(self, x, y):
        for cur in self.tiles:
            if cur.contains(x,y):
                return cur
        return None

