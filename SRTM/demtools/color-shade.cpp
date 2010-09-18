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

struct SColor
{
  int Red;
  int Green;
  int Blue;
};

struct SColorPoint
{
  int Elevation;
  SColor Color;
};

vector<SColorPoint*> ColorPointList;

//=============================================================================
void ReadColorScale(const string& ScaleFileName)
{
  ifstream ScaleFile;
  string Buffer;
  list<string> StringList;
  SColorPoint* TempColorPoint;

  ScaleFile.open(ScaleFileName.c_str(), ios::in);

  if (!ScaleFile.is_open())
  {
    cout << "Error opening color scale file : " << ScaleFileName << endl;
    exit (1);
  }

  while (!ScaleFile.eof())
  {
    StringList.clear();
    getline(ScaleFile, Buffer);

    // Strip spaces in case we have a blank line
    while (Buffer[0] == ' ')
    {
      Buffer.erase(0);
    }

    // If not a blank line
    if (Buffer != "")
    {
      TempColorPoint = new SColorPoint;
      stringtok(StringList, Buffer, " ");
      list<string>::iterator i = StringList.begin();
      TempColorPoint->Elevation = atoi(string(*i).c_str());
      i++;
      TempColorPoint->Color.Red = atoi(string(*i).c_str());
      i++;
      TempColorPoint->Color.Green = atoi(string(*i).c_str());
      i++;
      TempColorPoint->Color.Blue = atoi(string(*i).c_str());

      ColorPointList.push_back(TempColorPoint);
    }
  }

  ScaleFile.close();
}

//=============================================================================
// Given an elevation calculate a color based on the color points table
// At the moment we're only doing linear color gradients
//=============================================================================
SColor GetColor(float Elevation)
{
  SColor Color = {0,0,0};
  SColorPoint* LowerColorPoint = NULL;
  SColorPoint* UpperColorPoint = NULL;
  SColorPoint* TempColorPoint;
  float TempElev;
  float DiffFactor;

  // Find closest pair of color points that the elevation falls between
  // Lower color point
  TempElev = -64000;
  for (unsigned int i = 0; i < ColorPointList.size(); i++)
  {
    TempColorPoint = ColorPointList[i];
    if ((TempColorPoint->Elevation <= Elevation) && (TempElev < TempColorPoint->Elevation))
    {
      TempElev = TempColorPoint->Elevation;
      LowerColorPoint = TempColorPoint;
    }
  }
  // Upper color point
  TempElev = 64000;
  for (unsigned int i = 0; i < ColorPointList.size(); i++)
  {
    TempColorPoint = ColorPointList[i];
    if ((TempColorPoint->Elevation >= Elevation) && (TempElev > TempColorPoint->Elevation))
    {
      TempElev = TempColorPoint->Elevation;
      UpperColorPoint = TempColorPoint;
    }
  }

  // I should change the following clipping logic to use the color scale instead
  // Return blue
  if (LowerColorPoint == NULL)
  {
    Color.Red = 150;
    Color.Green = 150;
    Color.Blue = 255;
    return Color;
  }

  // Return white
  if (UpperColorPoint == NULL)
  {
    Color.Red = 255;
    Color.Green = 255;
    Color.Blue = 255;
    return Color;
  }

  // Work out the factor the elevation is between the lower and upper color point elevations
  // If the upper and lower color points point to the same color point object then
  // it means that the elevation falls exactly on a color point
  if (LowerColorPoint != UpperColorPoint)
  {
    DiffFactor = (Elevation - LowerColorPoint->Elevation) / (UpperColorPoint->Elevation - LowerColorPoint->Elevation);
    Color.Red   = (int)((UpperColorPoint->Color.Red - LowerColorPoint->Color.Red) * DiffFactor) + LowerColorPoint->Color.Red;
    Color.Green = (int)((UpperColorPoint->Color.Green - LowerColorPoint->Color.Green) * DiffFactor) + LowerColorPoint->Color.Green;
    Color.Blue  = (int)((UpperColorPoint->Color.Blue - LowerColorPoint->Color.Blue) * DiffFactor) + LowerColorPoint->Color.Blue;
  }
  else
  {
    Color.Red   = LowerColorPoint->Color.Red;
    Color.Green = LowerColorPoint->Color.Green;
    Color.Blue  = LowerColorPoint->Color.Blue;
  }

  return Color;
}

void get(CImg<float>* InPixels, int j, int i, int x, int y, int nYSize, float* out) {
  int cx;
  int cy;
  for (cx = 0 ; cx < x ; cx++) {
    for (cy = 0 ; cy < y ; cy++) {
      out[cx * y + cy] = (*InPixels)(j+cx, i+cy);
//      InPixels[(j+cx) * nYSize + i+cy];
    }
  }
}

int main(int argc, char* argv[])
{
  if (argc < 3)
  {
    cout << "color-shade generates a color relief map from any GDAL-supported elevation raster and a shaded relief map from any GDAL-supported elevation raster.";
    cout << "The final result is the multiplication of the booth maps." << endl;
    cout << endl << "Usage:" << endl;
    cout << "color-shade <input_dem> <input_color_scale> <output_relief_map>" << endl;
    cout << "[-a addFactor (0..1, default 0)]" << endl;
    cout << "                 [-z ZFactor (default=1)] [-s scale* (default=1)]" << endl;
    cout << "                 [-az Azimuth (default=315)] [-alt Altitude (default=45)]" << endl << endl;

    cout << "Notes about color relief map (input_color_scale):" << endl;
    cout << "The input color scale is a file containing a set of elevation points (in meters)" << endl;
    cout << "and colors. Typically only a small number of elevation and color sets will be needed" << endl;
    cout << "and the rest will be interpolated by color-relief." << endl;
    cout << "Example color scale file with 4000 meters set to white and 0 meters set to green:" << endl;
    cout << "4000 255 255 255" << endl;
    cout << "0 0 255 0" << endl << endl;
    cout << "Using true black (0 0 0) as your RGB values will yield blank/null cells." << endl;
    cout << "Note that to remove nodata from the output, set the DEM's nodata value to rgb of 0 0 0:" << endl;
    cout << "-32767 0 0 0" << endl << endl;
    cout << "See the accompanying \"scale.txt\" file for a decent example." << endl << endl;

    cout << "Notes about shaded relief map:" << endl;
    cout << "   Scale for Feet:Latlong use scale=370400, for Meters:LatLong use scale=111120" << endl << endl;;

    cout << "Notes map meging:" << endl;
    cout << "   The add factor can be use to add some britness." << endl;
    cout << "   the used calcul: result = colorPixel * (addFactor + shadePixel / 256.0)." << endl << endl;

    exit(1);
  }

  const char* InFilename = argv[1];
  const string ScaleFilename = argv[2];
  const char* OutFilename = argv[3];

  // Open and read color scale file
  ReadColorScale(ScaleFilename);

  GDALAllRegister();

  // Open dataset and get raster band
  GDALDataset* poDataset = (GDALDataset*) GDALOpen(InFilename, GA_ReadOnly);
  if(poDataset == NULL)
  {
    cout << "Couldn't open dataset " << InFilename << endl;
    exit(-1);
  }

  GDALRasterBand *poInBand;
  poInBand = poDataset->GetRasterBand(1);
  double       adfGeoTransform[6];
  poDataset->GetGeoTransform(adfGeoTransform);

  // Get variables from input dataset
  const int nXSize = poInBand->GetXSize();
  const int nYSize = poInBand->GetYSize();
  float* RowRed = (float *) CPLMalloc(sizeof(float)*nXSize);
  float* RowGreen = (float *) CPLMalloc(sizeof(float)*nXSize);
  float* RowBlue = (float *) CPLMalloc(sizeof(float)*nXSize);

  // Create the output dataset and copy over relevant metadata
  const char*  Format = "GTiff";
  GDALDriver *poDriver = GetGDALDriverManager()->GetDriverByName(Format);
  GDALDataset      *poDS;
  GDALRasterBand   *poBandRed;
  GDALRasterBand   *poBandGreen;
  GDALRasterBand   *poBandBlue;
  char**           Options = NULL;

  poDS = poDriver->Create(OutFilename,nXSize,nYSize,3,GDT_Byte,Options);
  poDS->SetGeoTransform(adfGeoTransform);
  poDS->SetProjection(poDataset->GetProjectionRef());

  poBandRed = poDS->GetRasterBand(1);
  poBandRed->SetNoDataValue(0);
  poBandGreen = poDS->GetRasterBand(2);
  poBandGreen->SetNoDataValue(0);
  poBandBlue = poDS->GetRasterBand(3);
  poBandBlue->SetNoDataValue(0);

  float       add = 0;
  float       z = 1.0;
  float       scale = 1.0;
  float       az = 315.0;
  float       alt = 45.0;
  for ( int iArg = 4; iArg < argc; iArg++ )
  {
    if( EQUAL(argv[iArg],"-a") ||
          EQUAL(argv[iArg],"-add"))
      add = atof(argv[iArg+1]);
    if( EQUAL(argv[iArg],"-z") )
      z = atof(argv[iArg+1]);
    if( EQUAL(argv[iArg],"-s") ||
          EQUAL(argv[iArg],"-scale"))
      scale = atof(argv[iArg+1]);
    if( EQUAL(argv[iArg],"-az") ||
          EQUAL(argv[iArg],"-azimuth"))
      az = atof(argv[iArg+1]);
    if( EQUAL(argv[iArg],"-alt") ||
          EQUAL(argv[iArg],"-altitude"))
      alt = atof(argv[iArg+1]);
  }

  GDALAllRegister();
  const float inputNullValue = (float) poInBand->GetNoDataValue( );

  cout << "Read image." << endl;
  CImg<float>* InPixels = new CImg<float>(nXSize, nYSize, 1, 1, 0);
  for (int i = 0; i < nYSize; i++) {
    for (int j = 0; j < nXSize; j++) {
      float InPixel;
      poInBand->RasterIO(GF_Read, j, i, 1, 1, &InPixel, 1, 1, GDT_Float32, 0, 0);
      (*InPixels)(j, i) = InPixel;
    }
  }
  
  cout << "Create color-shade image." << endl;
//  int winsize = 9;
  float *win = (float *) CPLMalloc(sizeof(float)*9);
  /* ------------------------------------------
   * Move a 3x3 window over each cell 
   * (where the cell in question is #4)
   *
   *                 0 1 2
   *                 3 4 5
   *                 6 7 8
   *
   */
  for (int i = 0; i < nYSize; i++) {
//    float* shadeBuf = (float *) CPLMalloc(sizeof(float)*nXSize);
    for (int j = 0; j < nXSize; j++) {
      // For the edges
      if (i == 0)
      {
        if (j == 0)
        {
	  get(InPixels, j, i, 2, 2, nYSize, win);
          win[8] = win[3];
          win[7] = win[2];
          win[5] = win[1];
          win[4] = win[0];
          win[0] = 2*win[4] - win[8];
          win[1] = 2*win[4] - win[7];
          win[2] = 2*win[5] - win[8];
          win[3] = 2*win[4] - win[5];
          win[6] = 2*win[7] - win[8];
        }
        else if (j == nXSize-1)
        {
	  get(InPixels, j-1, i, 2, 2, nYSize, win);
          win[5] = win[3];
          win[4] = win[2];
          win[2] = win[1];
          win[1] = win[0];
          win[0] = 2*win[1] - win[2];
          win[3] = 2*win[4] - win[5];
          win[6] = 2*win[4] - win[8];
          win[7] = 2*win[4] - win[1];
          win[8] = 2*win[5] - win[2];
        }
        else
        {
	  get(InPixels, j-1, i, 3, 2, nYSize, win);
          win[8] = win[5];
          win[7] = win[4];
          win[5] = win[3];
          win[4] = win[2];
          win[2] = win[1];
          win[1] = win[0];
          win[0] = 2*win[1] - win[2];
          win[3] = 2*win[4] - win[5];
          win[6] = 2*win[7] - win[8];
        }
      }
      else if (i == nYSize-1)
      {
        if (j == 0)
        {
	  get(InPixels, j, i-1, 2, 2, nYSize, win);
          win[7] = win[3];
          win[6] = win[2];
          win[4] = win[1];
          win[3] = win[0];
          win[0] = 2*win[3] - win[6];
          win[1] = 2*win[4] - win[7];
          win[2] = 2*win[4] - win[6];
          win[5] = 2*win[4] - win[3];
          win[8] = 2*win[7] - win[6];
        }
        else if (j == nXSize-1)
        {
	  get(InPixels, j-1, i-1, 2, 2, nYSize, win);
          win[4] = win[3];
          win[3] = win[2];
          win[1] = win[1];
          win[0] = win[0];
          win[2] = 2*win[1] - win[0];
          win[5] = 2*win[4] - win[3];
          win[6] = 2*win[3] - win[0];
          win[7] = 2*win[4] - win[1];
          win[8] = 2*win[4] - win[0];
        }
        else
        {
	  get(InPixels, j-1, i-1, 3, 2, nYSize, win);
          win[7] = win[5];
          win[6] = win[4];
          win[4] = win[3];
          win[3] = win[2];
          win[1] = win[1];
          win[0] = win[0];
          win[2] = 2*win[1] - win[0];
          win[5] = 2*win[4] - win[3];
          win[8] = 2*win[7] - win[6];
        }
      }
      else
      {
        if (j == 0)
        {
	  get(InPixels, j, i-1, 2, 3, nYSize, win);
          win[8] = win[5];
          win[7] = win[4];
          win[6] = win[3];
          win[5] = win[2];
          win[4] = win[1];
          win[3] = win[0];
          win[0] = 2*win[3] - win[6];
          win[1] = 2*win[4] - win[7];
          win[2] = 2*win[5] - win[8];
        }
        else if (j == nXSize-1)
        {
	  get(InPixels, j-1, i-1, 2, 3, nYSize, win);
          win[5] = win[5];
          win[4] = win[4];
          win[3] = win[3];
          win[2] = win[2];
          win[1] = win[1];
          win[0] = win[0];
          win[6] = 2*win[3] - win[0];
          win[7] = 2*win[4] - win[1];
          win[8] = 2*win[5] - win[2];
        }
        else
        {
          // Read in 3x3 window
	  get(InPixels, j-1, i-1, 3, 3, nYSize, win);
        }
      }


      // We have a valid 3x3 window.

      /* ---------------------------------------
       * Compute Hillshade
       */

      // First Slope ...
      const double nsres = adfGeoTransform[5];
      const double ewres = adfGeoTransform[1];
      float x = ((z*win[0] + z*win[3] + z*win[3] + z*win[6]) -
                    (z*win[2] + z*win[5] + z*win[5] + z*win[8])) /
                    (8.0 * ewres * scale);

      float y = ((z*win[6] + z*win[7] + z*win[7] + z*win[8]) -
                    (z*win[0] + z*win[1] + z*win[1] + z*win[2])) /
                    (8.0 * nsres * scale);

      const float radiansToDegrees = 180.0 / 3.14159;
      const float degreesToRadians = 3.14159 / 180.0;
      float slope = 90.0 - atan(sqrt(x*x + y*y))*radiansToDegrees;

      // ... then aspect...
      float aspect = atan2(x,y);

      // ... then the shade value
      float cang = sin(alt*degreesToRadians) * sin(slope*degreesToRadians) +
                       cos(alt*degreesToRadians) * cos(slope*degreesToRadians) *
                       cos((az-90.0)*degreesToRadians - aspect);

  /* -------------------------------------
   * Get variables from input dataset
   */
/*
  int         n;

  SColor       TempColor;

  const float nullValue = 0.0;

  /* -----------------------------------------
   * Create the output dataset and copy over relevant metadata
   */
/*  poDriver = GetGDALDriverManager()->GetDriverByName(Format);
  char **papszOptions = NULL;
  */

      if (cang <= 0.0) 
        cang = 1.0;
      else
        cang = 1.0 + (254.0 * cang);

//      shadeBuf[j] = cang;

      float InPixel = (*InPixels)(j, i);

      SColor TempColor = GetColor(InPixel);
//      float facteur = add + shadeBuf[j] / 256.0;
      float facteur = add + cang / 256.0;
      RowRed[j]   = TempColor.Red * facteur;
      RowGreen[j] = TempColor.Green * facteur;
      RowBlue[j]  = TempColor.Blue * facteur;
    }

    // Write lines to output raster
    poBandRed->RasterIO(GF_Write, 0, i, nXSize, 1, RowRed, nXSize, 1, GDT_Float32, 0, 0);
    poBandGreen->RasterIO(GF_Write, 0, i, nXSize, 1, RowGreen, nXSize, 1, GDT_Float32, 0, 0);
    poBandBlue->RasterIO(GF_Write, 0, i, nXSize, 1, RowBlue, nXSize, 1, GDT_Float32, 0, 0);

  }

  delete poDS;

  return 0;

}
