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

#define NB_W 40
#define S_W 9*120
#define NB_H 21
#define S_H 8*120


int main(int argc, char* argv[])
{
  if (argc < 2)
  {
    cout << "webco <infile> <outfile>" << endl;
    exit(1);
  }

  const char* InFilename = argv[1];
  const char* OutFilename = argv[2];

  GDALAllRegister();

  // Create the output dataset and copy over relevant metadata
  const char*  Format = "GTiff";
  GDALDriver *poDriver = GetGDALDriverManager()->GetDriverByName(Format);
  char**           Options = NULL;

  
  FILE *file = fopen(InFilename, "r");

  cout << "Remove header." << endl;
  fseek(file, 611, SEEK_CUR);

  cout << "Seek to lat 84." << endl;
  fseek(file, 2*120*6*WIDTH, SEEK_CUR);

  cout << "Process image." << endl;
  for (int f = 0; f < NB_H; f++) {
    GDALDataset* poDS[NB_W];
    GDALRasterBand* poBand[NB_W];
    int lat = 84-f*8;
    for (int i = 0 ; i < NB_W ; i++) {
      char filename[20];
      int lon = i*9-180;
      {
        char ns = lat < 0 ? 'S' : 'N';
        char ew = lon < 0 ? 'W' : 'E';
        sprintf(filename, "multi/%c%02i%c%03i.tif", ns, abs(lat), ew, abs(lon));
      }
      poDS[i] = poDriver->Create(filename,120*9,120*8,1,GDT_Float32,Options);
      // top left x, w-e pixel resolution, rotation, top left y, rotation, n-s pixel resolution
      double adfGeoTransform[6] = { lon, 1/120.0, 0, lat, 0, -1/120.0 };
      poDS[i]->SetGeoTransform(adfGeoTransform);

    //  poDS->SetProjection(poDataset->GetProjectionRef());
      poBand[i] = poDS[i]->GetRasterBand(1);
      poBand[i]->SetNoDataValue(-9999);
    }

    GDALAllRegister();


    for (int i = 0; i < 120*8; i++) {
      cout << "\r" << (f*HEIGHT/NB_H + i) << "/" << HEIGHT;
      int pixel_y = i;
      for (int j = 0; j < 360*120; j++) {
        int16_t height;
        int size = fread(&height, 2, 1, file);
        float pixel = (float)height;
        
        int file_x = j/120/9;
        int pixel_x = j%(120*9);
        poBand[file_x]->RasterIO(GF_Write, pixel_x, pixel_y, 1, 1, &pixel, 1, 1, GDT_Float32, 0, 0);
      }
    }
    for (int i = 0 ; i < NB_W ; i++) {
      delete poDS[i];
    }
  }
  cout << endl;

  fclose(file);

  return 0;

}
