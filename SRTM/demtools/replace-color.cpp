/****************************************************************************
 * color-hillshade.cpp
 * Author: Stéphane Brunner, Matthew Perry, Paul Surgeon
 * License : 
 Copyright 2005 Matthew T. Perry, 2005 Paul Surgeon, 2008 Stéphane Brunner
 Licensed under the Apache License, Version 2.0 (the "License"); 
 you may not use this file except in compliance with the License. 
 You may obtain a copy of the License at 
 
 http://www.apache.org/licenses/LICENSE-2.0 
 
 Unless required by applicable law or agreed to in writing, software 
 distributed under the License is distributed on an "AS IS" BASIS, 
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 See the License for the specific language governing permissions and 
 limitations under the License.

 * calculates a shaded relief image from a gdal-supported raster DEM
 
 CHANGELOG
 * updated nodata handling so that 0 is nodata and 1 - 255 are the shade values
 ****************************************************************************/

#include <iostream>
#include <stdlib.h>
#include <math.h>
#include <fstream>
#include <list>
#include "gdal_priv.h"

using namespace std;

int main(int argc, char* argv[])
{
  if (argc < 2)
  {
    cout << "replace-color <infile> <outfile>" << endl;
    exit(1);
  }

  const char* InFilename = argv[1];
  const char* OutFilename = argv[2];

  GDALAllRegister();

  // Open dataset and get raster band
  GDALDataset* poDataset = (GDALDataset*) GDALOpen(InFilename, GA_ReadOnly);
  if(poDataset == NULL)
  {
    cout << "Couldn't open dataset " << InFilename << endl;
  }

  GDALRasterBand *poInBandr;
  GDALRasterBand *poInBandg;
  GDALRasterBand *poInBandb;
  poInBandr = poDataset->GetRasterBand(1);
  poInBandg = poDataset->GetRasterBand(2);
  poInBandb = poDataset->GetRasterBand(3);
  double adfGeoTransform[6];
  poDataset->GetGeoTransform(adfGeoTransform);

  // Get variables from input dataset
  const int nXSize = poInBandr->GetXSize();
  const int nYSize = poInBandr->GetYSize();

  // Create the output dataset and copy over relevant metadata
  const char*  Format = "GTiff";
  GDALDriver *poDriver = GetGDALDriverManager()->GetDriverByName(Format);
  char** Options = NULL;

  GDALDataset* poDS = poDriver->Create(OutFilename,nXSize,nYSize,3,GDT_Byte,Options);
  poDS->SetGeoTransform(adfGeoTransform);
  poDS->SetProjection(poDataset->GetProjectionRef());
  GDALRasterBand* poBandr = poDS->GetRasterBand(1);
  GDALRasterBand* poBandg = poDS->GetRasterBand(2);
  GDALRasterBand* poBandb = poDS->GetRasterBand(3);
  poBandr->SetNoDataValue(0);
  poBandg->SetNoDataValue(0);
  poBandb->SetNoDataValue(0);

  GDALAllRegister();

  cout << "Replacing." << endl;
  unsigned char InPixelr;
  unsigned char InPixelg;
  unsigned char InPixelb;

  for (int i = 0; i < nYSize; i++) {
    cout << "\r" << i << "/" << nYSize;
    for (int j = 0; j < nXSize; j++) {
//      unsigned char InPixel;
      poInBandr->RasterIO(GF_Read, j, i, 1, 1, &InPixelr, 1, 1, GDT_Byte, 0, 0);
      poInBandg->RasterIO(GF_Read, j, i, 1, 1, &InPixelg, 1, 1, GDT_Byte, 0, 0);
      poInBandb->RasterIO(GF_Read, j, i, 1, 1, &InPixelb, 1, 1, GDT_Byte, 0, 0);

      if (InPixelr == 0xb5 && InPixelg == 0xd0 && InPixelb == 0xd0) { // ocean blue
    
/*          unsigned char InPixelr = 0xb4; // ocean blue
        unsigned char InPixelg = 0xd1; b4d1cf
        unsigned char InPixelb = 0xcf;*/
        InPixelr = 0x98; // green earth
        InPixelg = 0xd7;
        InPixelb = 0x88;
      }

      poBandr->RasterIO(GF_Write, j, i, 1, 1, &InPixelr, 1, 1, GDT_Byte, 0, 0);
      poBandg->RasterIO(GF_Write, j, i, 1, 1, &InPixelg, 1, 1, GDT_Byte, 0, 0);
      poBandb->RasterIO(GF_Write, j, i, 1, 1, &InPixelb, 1, 1, GDT_Byte, 0, 0);

    }
  }
  cout << endl;

  delete poDS;

  return 0;

}
