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
#include "stringtok.h"

#define cimg_use_magick 1
#include "CImg.h"

using namespace std;
using namespace cimg_library;

int main(int argc, char* argv[])
{
  if (argc < 2)
  {
    cout << "void-filing <infile> <outfile>" << endl;
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

  GDALRasterBand *poInBand;
  poInBand = poDataset->GetRasterBand(1);
  double adfGeoTransform[6];
  poDataset->GetGeoTransform(adfGeoTransform);

  // Get variables from input dataset
  const int nXSize = poInBand->GetXSize();
  const int nYSize = poInBand->GetYSize();

  // Create the output dataset and copy over relevant metadata
  const char*  Format = "GTiff";
  GDALDriver *poDriver = GetGDALDriverManager()->GetDriverByName(Format);
  char** Options = NULL;
  float inputNullValue = (float) poInBand->GetNoDataValue();
  if (inputNullValue <= -100000 || inputNullValue >= 100000) {
      inputNullValue = 32767;
  }

  GDALDataset* poDS = poDriver->Create(OutFilename,nXSize,nYSize,1,GDT_Float32,Options);
  poDS->SetGeoTransform(adfGeoTransform);
  poDS->SetProjection(poDataset->GetProjectionRef());
  GDALRasterBand* poBand = poDS->GetRasterBand(1);
  poBand->SetNoDataValue(inputNullValue);

  GDALAllRegister();

  cout << "InputNullValue: " << inputNullValue << endl;
  cout << "Read image." << endl;
  CImg<float>* ReadPixels = new CImg<float>(nXSize, nYSize, 1, 1, 0);
  for (int i = 0; i < nYSize; i++) {
    for (int j = 0; j < nXSize; j++) {
      float InPixel;
      poInBand->RasterIO(GF_Read, j, i, 1, 1, &InPixel, 1, 1, GDT_Float32, 0, 0);
      if (InPixel > 15000) {
      	InPixel = inputNullValue;
      }
      if (InPixel < -1000) {
      	InPixel = inputNullValue;
      }
      (*ReadPixels)(j, i) = InPixel;
    }
  }

  cout << "Void filling." << endl;
  CImg<float>* InPixels = new CImg<float>(nXSize, nYSize, 1, 1, -1000);
  for (int i = 0; i < nYSize; i++) {
    cout << "\r" << i << "/" << nYSize;
    for (int j = 0; j < nXSize; j++) {
    
      if ((*ReadPixels)(j, i) == inputNullValue && (*InPixels)(j, i) == -1000) {
	  cout << ".";
        int is = i;
        int ie = i;
        int js = j;
        int je = j;
        const int testsize = 150;
        const int maxsize = 500;
	for (int k = max(i-testsize, 0) ; k <= min(i+testsize, nYSize-1) ; k++) {
	  while (js != 0 && js > j-maxsize && (*ReadPixels)(js, k) == inputNullValue) {
	    js--;
	  }
	  while (je != nXSize-1 && je < j+maxsize && (*ReadPixels)(je, k) == inputNullValue) {
	    je++;
	  }
	}
	for (int k = max(j-testsize, 0) ; k <= min(j+testsize, nYSize-1) ; k++) {
	  while (is != 0 && is > j-maxsize && (*ReadPixels)(k, is) == inputNullValue) {
	    is--;
	  }
	  while (ie != nYSize-1 && ie < j+maxsize && (*ReadPixels)(k, ie) == inputNullValue) {
	    ie++;
	  }
	}

	float fact = 0;
	float sum = 0;
	for (int ia = is ; ia <= ie ; ia++) {
	  for (int ja = js ; ja <= je ; ja++) {
	    if ((*ReadPixels)(ja, ia) != inputNullValue) {
	      int ik = ia - i;
	      int jk = ja - j;
	      float length = ik*ik+jk*jk;
	      float coef = 1/(length*length);
	      sum += ((*ReadPixels)(ja, ia))*coef;
	      fact += coef;
	    }
	  }
	(*InPixels)(j, i) = sum / fact;
	}
      }
      else if ((*ReadPixels)(j, i) != inputNullValue) {
        (*InPixels)(j, i) = (*ReadPixels)(j, i);
      }
    }
  }
  cout << endl;

  cout << "Blur." << endl;
  InPixels->blur(1);
  
  cout << "Final merge." << endl;
  for (int i = 0; i < nYSize; i++) {
    cout << "\r" << i << "/" << nYSize;
    for (int j = 0; j < nXSize; j++) {
      float InPixel;
      InPixel = (*ReadPixels)(j, i);
      if (InPixel == inputNullValue) {
        InPixel = (*InPixels)(j, i);
      }
      poBand->RasterIO(GF_Write, j, i, 1, 1, &InPixel, 1, 1, GDT_Float32, 0, 0);
    }
  }
  cout << endl;

  delete poDS;

  return 0;

}
