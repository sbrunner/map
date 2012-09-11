#!/usr/bin/python

## sudo -u postgres time ionice -c3 nice -n 19 ./generate_tiles_1024.py
## time ionice -c3 nice -n 19 ./generate_tiles_1024.py

from math import pi, cos, sin, log, exp, atan
from subprocess import call
import sys, os
import json
import multiprocessing

try:
    import mapnik2 as mapnik
except:
    import mapnik

DEG_TO_RAD = pi / 180
RAD_TO_DEG = 180 / pi

# Default number of rendering threads to spawn, should be roughly equal to number of CPU cores available
NUM_THREADS = 2
TILES_SIZE = 1024


def minmax (a,b,c):
    a = max(a,b)
    a = min(a,c)
    return a

class GoogleProjection:
    def __init__(self, levels=18):
        self.Bc = []
        self.Cc = []
        self.zc = []
        self.Ac = []
        c = TILES_SIZE
        for d in range(0,levels):
            e = c/2;
            self.Bc.append(c/360.0)
            self.Cc.append(c/(2 * pi))
            self.zc.append((e,e))
            self.Ac.append(c)
            c *= 2

    def fromLLtoPixel(self,ll,zoom):
        d = self.zc[zoom]
        e = round(d[0] + ll[0] * self.Bc[zoom])
        f = minmax(sin(DEG_TO_RAD * ll[1]),-0.9999,0.9999)
        g = round(d[1] + 0.5*log((1+f)/(1-f))*-self.Cc[zoom])
        return (e,g)

    def fromPixelToLL(self,px,zoom):
        e = self.zc[zoom]
        f = (px[0] - e[0])/self.Bc[zoom]
        g = (px[1] - e[1])/-self.Cc[zoom]
        h = RAD_TO_DEG * ( 2 * atan(exp(g)) - 0.5 * pi)
        return (f,h)



class RenderThread:
    def __init__(self, tile_dir, mapfile, q, printLock, maxZoom):
        self.tile_dir = tile_dir
        self.mapfile = mapfile
        self.q = q
        self.maxZoom = maxZoom
        self.printLock = printLock


    def render_tile(self, tile_uri, x, y, z):
        # Calculate pixel positions of bottom-left & top-right
        p0 = (x * TILES_SIZE, (y + 1) * TILES_SIZE)
        p1 = ((x + 1) * TILES_SIZE, y * TILES_SIZE)

        # Convert to LatLong (EPSG:4326)
        l0 = self.tileproj.fromPixelToLL(p0, z);
        l1 = self.tileproj.fromPixelToLL(p1, z);

        # Convert to map projection (e.g. mercator co-ords EPSG:900913)
        c0 = self.prj.forward(mapnik.Coord(l0[0],l0[1]))
        c1 = self.prj.forward(mapnik.Coord(l1[0],l1[1]))

        # Bounding box for the tile
        if hasattr(mapnik,'mapnik_version') and mapnik.mapnik_version() >= 800:
            bbox = mapnik.Box2d(c0.x,c0.y, c1.x,c1.y)
        else:
            bbox = mapnik.Envelope(c0.x,c0.y, c1.x,c1.y)
        render_size = TILES_SIZE
        self.m.resize(render_size, render_size)
        self.m.zoom_to_box(bbox)
        self.m.buffer_size = 128

        if FORMAT == 'grid':
            grid = mapnik.Grid(render_size, render_size)
#            mapnik.render_layer(self.m, grid, layer=64, fields=['name'])
            for n, l in enumerate(self.m.layers):
                if l.name != 'admin-012345678':
                    if 'name' in l.datasource.fields():
                        mapnik.render_layer(self.m, grid, layer=n, fields=['name'])
            utfgrid = grid.encode('utf', resolution=4)
            f = open(tile_uri + '.' + FILE_EXTENSION, 'w')
            f.write(json.dumps(utfgrid))
            f.close()
        else:
            # Render image with default Agg renderer
            im = mapnik.Image(render_size, render_size)
            mapnik.render(self.m, im)
            im.save(tile_uri + '.' + FILE_EXTENSION, FORMAT)



    def loop(self, nb):
        self.m = mapnik.Map(TILES_SIZE, TILES_SIZE)
        # Load style XML
        mapnik.load_map(self.m, self.mapfile, True)
        # Obtain <Map> projection
        self.prj = mapnik.Projection(self.m.srs)
        # Projects between tile pixel co-ordinates and LatLong (EPSG:4326)
        self.tileproj = GoogleProjection(self.maxZoom + 1)

        while True:
            #Fetch a tile from the queue and render it
            r = self.q.get()
            if (r == None):
                self.q.task_done()
                break
            else:
                (name, tile_uri, x, y, z) = r

            exists = ""
            if os.path.isfile(tile_uri + '.' + FILE_EXTENSION):
                exists = "exists"
            else:
                self.render_tile(tile_uri, x, y, z)

            self.printLock.acquire()
            print name, ":", z, x, y, exists
            self.printLock.release()
            self.q.task_done()



def render_tiles(bbox, mapfile, tile_dir, minZoom=1, maxZoom=18, name="unknown", num_threads=NUM_THREADS):
    print "render_tiles(", bbox, '(...)', tile_dir, minZoom, maxZoom, name, ")"

    # Launch rendering threads
    queue = multiprocessing.JoinableQueue(32)
    printLock = multiprocessing.Lock()
    renderers = {}
    for i in range(num_threads):
        renderer = RenderThread(tile_dir, mapfile, queue, printLock, maxZoom)
        render_thread = multiprocessing.Process(target=renderer.loop, args=(i,))
        render_thread.start()
        #print "Started render thread %s" % render_thread.getName()
        renderers[i] = render_thread

    if not os.path.isdir(tile_dir):
         os.mkdir(tile_dir)

    gprj = GoogleProjection(maxZoom+1)

    ll0 = (bbox[0],bbox[3])
    ll1 = (bbox[2],bbox[1])

    for z in range(minZoom,maxZoom + 1):
        px0 = gprj.fromLLtoPixel(ll0,z)
        px1 = gprj.fromLLtoPixel(ll1,z)

        # check if we have directories in place
        zoom = "%s" % z
        if not os.path.isdir(tile_dir + zoom):
            os.mkdir(tile_dir + zoom)
        for x in range(int(px0[0]/TILES_SIZE),int(px1[0]/TILES_SIZE)+1):
            # Validate x co-ordinate
            if (x < 0) or (x >= 2**z):
                continue
            # check if we have directories in place
            str_x = "%s" % x
            if not os.path.isdir(tile_dir + zoom + '/' + str_x):
                os.mkdir(tile_dir + zoom + '/' + str_x)
            for y in range(int(px0[1]/TILES_SIZE),int(px1[1]/TILES_SIZE)+1):
                # Validate x co-ordinate
                if (y < 0) or (y >= 2**z):
                    continue
                str_y = "%s" % y
                tile_uri = tile_dir + zoom + '/' + str_x + '/' + str_y
                # Submit tile to be rendered into the queue
                t = (name, tile_uri, x, y, z)
                queue.put(t)

    # Signal render threads to exit by sending empty request to queue
    for i in range(num_threads):
        queue.put(None)
    # wait for pending rendering jobs to complete
    queue.join()
    for i in range(num_threads):
        renderers[i].join()

#https://github.com/mapnik/mapnik/wiki/OutputFormats
#FORMAT = 'png'
#FILE_EXTENSION = 'png'
#FORMAT = 'jpeg'
#FILE_EXTENSION = 'jpeg'
FORMAT = 'grid'
FILE_EXTENSION = 'json'

if __name__ == "__main__":
    mapfile = "../../mapnik-stylesheets/osm.xml"
    tile_dir = "/media/Big/Test/png/"
    tile_dir = "/media/Big/Test/admin/"
    tile_dir = "/media/Big/Test/full/"

#    m = mapnik.Map(TILES_SIZE, TILES_SIZE)
#    mapnik.load_map(m, mapfile, False)
#    for n, l in enumerate(m.layers):
#        print n, l.name, l.datasource.fields()

    bbox = (-180.0,-90.0, 180.0,90.0)
#    render_tiles(bbox, mapfile, tile_dir, 0, 0, "World")
#    render_tiles(bbox, mapfile, tile_dir, 0, 4, "World")

    # Europe+
    bbox = (1.0,10.0, 20.6,60.0)
#    render_tiles(bbox, mapfile, tile_dir, 5, 8, "Europe+")

    bbox = (5.13,45.40, 11.46,48.24)
#    render_tiles(bbox, mapfile, tile_dir, 9, 13, "Swiss")
    render_tiles(bbox, mapfile, tile_dir, 12, 13, "Swiss")


#    bbox = (5.9, 45.7, 10.5, 47.9)
#    bbox = (5.13, 45.40, 11.46, 48.24) # Swiss
    bbox = (6.5, 46.45, 6.8, 46.66) # Lausanne Vevey

    mapfile = "incomplete.mapnik"
    tile_dir = "/media/Tiles/tiles/256/err/"
#    render_tiles(bbox, mapfile, tile_dir, 0, 16, "Swiss")
#    render_tiles(bbox, mapfile, tile_dir, 11, 14, "Swiss")

#    mapfile = "mapnik/osm.xml"
#    tile_dir = "/media/Tiles/tiles/1024/ch-2007-10/"
#    render_tiles(bbox, mapfile, tile_dir, 0, 16, "Swiss")

#    mapfile = "adrs.mapnik"
#    tile_dir = "/media/Tiles/tiles/1024/adrs/"
#    render_tiles(bbox, mapfile, tile_dir, 18, 16, "adrs")

 #   mapfile = "service.mapnik"
 #   tile_dir = "/media/Tiles/tiles/1024/service/"
 #   render_tiles(bbox, mapfile, tile_dir, 0, 16, "service")

#    mapfile = "parking.mapnik"
#    tile_dir = "/media/Tiles/tiles/1024/parking/"
#    render_tiles(bbox, mapfile, tile_dir, 0, 16, "parking")



