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
//#define HEIGHT 6000
#define HEIGHT 21600


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

  GDALDataset* poDS = poDriver->Create(OutFilename,WIDTH,HEIGHT,1,GDT_Float32,Options);
  // top left x, w-e pixel resolution, rotation, top left y, rotation, n-s pixel resolution
  double adfGeoTransform[6] = { -180, 1/120.0, 0, 90, 0, -1/120.0 };
  poDS->SetGeoTransform(adfGeoTransform);

//  poDS->SetProjection(poDataset->GetProjectionRef());
  GDALRasterBand* poBand = poDS->GetRasterBand(1);
  poBand->SetNoDataValue(-9999);

  GDALAllRegister();
  
  FILE *file = fopen(InFilename, "r");

  cout << "Remove header." << endl;
//  for (int i = 0; i < 612; i++) {
    char b[612] = {};
    int size = fread(b, 1, 611, file);
//  }
  cout << "Process image." << endl;
  for (int i = 0; i < HEIGHT; i++) {
    cout << "\r" << i << "/" << HEIGHT;
    for (int j = 0; j < WIDTH; j++) {
//      char buffer[2];
//      char* length = fgets(buffer, sizeof(buffer), file);
      int16_t height;
      int size = fread(&height, 2, 1, file);
      
      float pixel = (float)height;
      
      poBand->RasterIO(GF_Write, j, i, 1, 1, &pixel, 1, 1, GDT_Float32, 0, 0);
    }
  }
  cout << endl;

  delete poDS;
  fclose(file);

  return 0;

}
