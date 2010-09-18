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

#define cimg_use_magick 1
#include "CImg.h"

using namespace std;
using namespace cimg_library;

int isEmpty(CImg<unsigned char>* Pixels, int x, int y) {
//  return (*Pixels)(x, y, 0, 0) == 0 && (*Pixels)(x, y, 0, 1) == 0 && (*Pixels)(x, y, 0, 2) == 0;
  return (*Pixels)(x, y, 0, 0) + (*Pixels)(x, y, 0, 1) + (*Pixels)(x, y, 0, 2) < 150;
}

int main(int argc, char* argv[])
{
  if (argc < 2)
  {
    cout << "void-filing-color <infile> <outfile>" << endl;;
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

  cout << "Read image." << endl;
  CImg<unsigned char>* ReadPixels = new CImg<unsigned char>(nXSize, nYSize, 1, 3, 0);
  for (int i = 0; i < nYSize; i++) {
    cout << "\r" << i << "/" << nYSize;
    for (int j = 0; j < nXSize; j++) {
      unsigned char InPixel;
      poInBandr->RasterIO(GF_Read, j, i, 1, 1, &InPixel, 1, 1, GDT_Byte, 0, 0);
      (*ReadPixels)(j, i, 0, 0) = InPixel;
      poInBandg->RasterIO(GF_Read, j, i, 1, 1, &InPixel, 1, 1, GDT_Byte, 0, 0);
      (*ReadPixels)(j, i, 0, 1) = InPixel;
      poInBandb->RasterIO(GF_Read, j, i, 1, 1, &InPixel, 1, 1, GDT_Byte, 0, 0);
      (*ReadPixels)(j, i, 0, 2) = InPixel;
    }
  }
  cout << endl;

  cout << "Void filling." << endl;
  CImg<unsigned char>* InPixels = new CImg<unsigned char>(nXSize, nYSize, 1, 3, 0);
  for (int i = 0; i < nYSize; i++) {
    cout << "\r" << i << "/" << nYSize;
    
    for (int j = 0; j < nXSize; j++) {
    
      if (isEmpty(ReadPixels, j, i) && isEmpty(InPixels, j, i)) {
        int is = i;
        int ie = i;
        int js = j;
        int je = j;
        const int maxsize = 2;
        js = max(0, j-maxsize);
        je = min(nXSize-1, j+maxsize);
        is = max(0, i-maxsize);
        ie = min(nYSize-1, i+maxsize);
//        cout << endl << js << ", " << je << ", " << is << ", " << ie;

        float fact = 0;
        float sumr = 0;
        float sumg = 0;
        float sumb = 0;
        for (int ia = is ; ia <= ie ; ia++) {
          for (int ja = js ; ja <= je ; ja++) {
//            cout << endl << ia << ", " << ja;
            if (!isEmpty(ReadPixels, ja, ia)) {
              int ik = ia - i;
              int jk = ja - j;
              float length = ik*ik+jk*jk;
              float coef = 1/(length*length);
              sumr += ((*ReadPixels)(ja, ia, 0, 0))*coef;
              sumg += ((*ReadPixels)(ja, ia, 0, 1))*coef;
              sumb += ((*ReadPixels)(ja, ia, 0, 2))*coef;
              fact += coef;
            }
          }
        }
//        cout << endl << sumr << ", " << sumg << ", " << sumb << ", " << fact;

        if (fact == 0) {
/*          unsigned char InPixelr = 0xb5; // ocean blue
          unsigned char InPixelg = 0xd0;
          unsigned char InPixelb = 0xd0;*/
          unsigned char InPixelr = 0x98; // green earth
          unsigned char InPixelg = 0xd7;
          unsigned char InPixelb = 0x88;

          poBandr->RasterIO(GF_Write, j, i, 1, 1, &InPixelr, 1, 1, GDT_Byte, 0, 0);
          poBandg->RasterIO(GF_Write, j, i, 1, 1, &InPixelg, 1, 1, GDT_Byte, 0, 0);
          poBandb->RasterIO(GF_Write, j, i, 1, 1, &InPixelb, 1, 1, GDT_Byte, 0, 0);
        }
        else {
          unsigned char InPixelr = (unsigned char)(sumr / fact);
          unsigned char InPixelg = (unsigned char)(sumg / fact);
          unsigned char InPixelb = (unsigned char)(sumb / fact);

          poBandr->RasterIO(GF_Write, j, i, 1, 1, &InPixelr, 1, 1, GDT_Byte, 0, 0);
          poBandg->RasterIO(GF_Write, j, i, 1, 1, &InPixelg, 1, 1, GDT_Byte, 0, 0);
          poBandb->RasterIO(GF_Write, j, i, 1, 1, &InPixelb, 1, 1, GDT_Byte, 0, 0);
        }
      }
      else if (!isEmpty(ReadPixels, j, i)) {
        unsigned char InPixelr = (*ReadPixels)(j, i, 0, 0);
        unsigned char InPixelg = (*ReadPixels)(j, i, 0, 1);
        unsigned char InPixelb = (*ReadPixels)(j, i, 0, 2);

        poBandr->RasterIO(GF_Write, j, i, 1, 1, &InPixelr, 1, 1, GDT_Byte, 0, 0);
        poBandg->RasterIO(GF_Write, j, i, 1, 1, &InPixelg, 1, 1, GDT_Byte, 0, 0);
        poBandb->RasterIO(GF_Write, j, i, 1, 1, &InPixelb, 1, 1, GDT_Byte, 0, 0);
      }
    }
  }
  cout << endl;

  delete poDS;

  return 0;

}
