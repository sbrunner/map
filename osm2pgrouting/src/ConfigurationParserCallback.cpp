/***************************************************************************
 *   Copyright (C) 2008 by Daniel Wendt   								   *
 *   gentoo.murray@gmail.com   											   *
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.             *
 ***************************************************************************/

#include "stdafx.h"
#include "ConfigurationParserCallback.h"
#include "OSMDocument.h"
#include "Configuration.h"

namespace osm
{
	
	
/**
	Parser callback for configuration files
*/
void ConfigurationParserCallback::StartElement( const char *name, const char** atts )
{
	std::cerr << "SE for <" << name << ">" << std::endl;
	if (strcmp(name, "edge") == 0 || strcmp(name, "vertex") == 0)
	{
		if (atts != NULL)
		{
			std::string k;
			const char** attribut = (const char**)atts;
			while (*attribut != NULL)
			{
				const char* key = *attribut++;
				const char* value = *attribut++;
				if (strcmp(key, "k") == 0)
				{
					k = std::string(value);
				}
			}
			if(!k.empty())
			{
                if (strcmp(name, "edge") == 0) {
                    m_rDocument.addEdge(k);
                }
                else {
                    m_rDocument.addVertex(k);
                }
			}
		}
	}
	else if( strcmp(name,"configuration") == 0 )
	{
	}
}

}; // end namespace osm
