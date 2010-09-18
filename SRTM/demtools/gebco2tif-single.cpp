#include <iostream>
#include <stdlib.h>
#include <math.h>
#include <fstream>
#include <list>
#include "gdal_priv.h"
#include "stringtok.h"

using namespace std;

#define WIDTH 43200
//#define HEIGHT 1200
#define HEIGHT 21600
#define MARGIN 10
#define RESOLUTION 120


int main(int argc, char* argv[])
{
  if (argc < 6)
  {
    cout << "webco <infile> <minlat> <minlon> <maxlat> <maxlon> <outfile>" << endl;
    exit(1);
  }

  const char* InFilename = argv[1];

  int minlatpixel;
  int minlonpixel;
  int maxlatpixel;
  int maxlonpixel;
  {
    double minlat = atoi(argv[2]);
    double minlon = atoi(argv[3]);
    double maxlat = atoi(argv[4]);
    double maxlon = atoi(argv[5]);
  
    minlatpixel = minlat*RESOLUTION;
    minlonpixel = minlon*RESOLUTION;
    maxlatpixel = maxlat*RESOLUTION;
    maxlonpixel = maxlon*RESOLUTION;

    if (minlon == -180.0) {
      minlonpixel += MARGIN;
      maxlonpixel += MARGIN;
    }
    if (maxlon == 180.0) {
      minlonpixel -= MARGIN;
      maxlonpixel -= MARGIN;
    }

  }

  const char* OutFilename = argv[6];

  GDALAllRegister();

  // Create the output dataset and copy over relevant metadata
  const char*  Format = "GTiff";
  GDALDriver *poDriver = GetGDALDriverManager()->GetDriverByName(Format);
  char**           Options = NULL;

  
  FILE *file = fopen(InFilename, "r");

  cout << "Remove header." << endl;
  fseek(file, 611, SEEK_CUR);

  {
    cout << "Seek to lon/lat." << endl;
    int seeklat = (90*RESOLUTION-maxlatpixel-MARGIN)*2*WIDTH;
    int seeklon = (minlonpixel+180*RESOLUTION-MARGIN)*2;
    fseek(file, seeklon+seeklat, SEEK_CUR);
/*    if (maxlon == 180) {
      fseek(file, 1, SEEK_CUR);
    }*/
  }

  cout << "Process image." << endl;
  GDALDataset* poDS;
  GDALRasterBand* poBand;

/*  char filename[20];
  {
    char ns = maxlat < 0 ? 'S' : 'N';
    char ew = minlon < 0 ? 'W' : 'E';
//    sprintf(filename, "multi/%c%02i%c%03i.tif", ns, abs(maxlat), ew, abs(minlon));
    sprintf(filename, "%c%02i%c%03i.tif", ns, abs(maxlat), ew, abs(minlon));
  }*/
  poDS = poDriver->Create(OutFilename,(maxlonpixel-minlonpixel)+2*MARGIN,(maxlatpixel-minlatpixel)+2*MARGIN,1,GDT_Float32,Options);
  // top left x, w-e pixel resolution, rotation, top left y, rotation, n-s pixel resolution
  double adfGeoTransform[6] = { (minlonpixel-MARGIN)*1.0/RESOLUTION, 1.0/RESOLUTION, 0, (maxlatpixel+MARGIN)*1.0/RESOLUTION, 0, -1.0/RESOLUTION };

  poDS->SetGeoTransform(adfGeoTransform);

//  poDS->SetProjection(poDataset->GetProjectionRef());
  poBand = poDS->GetRasterBand(1);
  poBand->SetNoDataValue(-9999);

  GDALAllRegister();

  for (int y = 0; y < (maxlatpixel-minlatpixel)+2*MARGIN; y++) {
    cout << "\r" << y << "/" << (maxlatpixel-minlatpixel)+2*MARGIN;
    for (int x = 0; x < (maxlonpixel-minlonpixel)+2*MARGIN; x++) {
      int16_t height;
      int size = fread(&height, 2, 1, file);
      float pixel = (float)height;
        
      poBand->RasterIO(GF_Write, x, y, 1, 1, &pixel, 1, 1, GDT_Float32, 0, 0);
    }
    fseek(file, ((360*RESOLUTION-maxlonpixel+minlonpixel)-2*MARGIN)*2, SEEK_CUR);
  }
  cout << endl;

  delete poDS;
  fclose(file);

  return 0;

}
