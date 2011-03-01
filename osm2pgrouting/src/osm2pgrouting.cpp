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
#include "Configuration.h"
#include "ConfigurationParserCallback.h"
#include "OSMDocument.h"
#include "OSMDocumentParserCallback.h"
#include "Way.h"
#include "Node.h"
#include "Export2DB.h"

using namespace osm;
using namespace xml;
using namespace std;

void _error()
{
				cerr << "following params are required: " << endl;
				cerr << "-file <file>  -- name of your osm xml file" << endl;
				cerr << "-conf <conf>  -- name of your configuration xml file" << endl;
				cerr << "optional:" << endl;
				cerr << "-clean -- drop peviously created tables" << endl;
					
}

int main(int argc, char* argv[])
{
	std::string file;
	std::string cFile;
	bool clean = false;
	int i=1;
	while(i<argc)
	{
		if(strcmp(argv[i],"-file")==0)
		{	
			i++;
			file = argv[i];
		}
		else if(strcmp(argv[i],"-conf")==0)
		{	
			i++;
			cFile = argv[i];
		}
		else if(strcmp(argv[i],"-clean")==0)
		{
			clean = true;
		}
		else
		{
			cerr << "unknown paramer: " << argv[i] << endl;
			_error();
			return 1;
		}
		
		i++;
	}
	
	if(file.empty() || cFile.empty())
	{
		_error();
		return 1;
	}
	
	XMLParser parser;
	
	cerr << "Trying to load config file " << cFile.c_str() << endl;

	Configuration* config = new Configuration();
        ConfigurationParserCallback cCallback( *config );

	cerr << "Trying to parse config" << endl;

	int ret = parser.Parse( cCallback, cFile.c_str() );
	if( ret!=0 ) return 1;

	cerr << "Trying to load data" << endl;

	OSMDocument* document = new OSMDocument(*config);
    OSMDocumentParserCallback callback(*document);

	cerr << "Trying to parse data" << endl;

	ret = parser.Parse( callback, file.c_str() );
	if( ret!=0 ) return 1;
	
	cerr << "Split ways" << endl;

	document->SplitWays();
	//############# Export2DB
	{
		Export2DB test;
		if (clean)
		{
			test.dropTables();
		}
		
		test.createTables(config->m_edge, config->m_vertex);
		
//		ez_mapdelete(document->m_Nodes);
//		document->m_Nodes = NULL;
 		
		cerr << "Create ways" << endl;
		while (!document->m_SplittedWays.empty()) {
			Way* way = document->m_SplittedWays.back();
			test.exportWay(way, config->m_edge, config->m_vertex);
			document->m_SplittedWays.pop_back();
			delete way;
		}
/*		std::vector<Way*>::iterator it_way(document->m_SplittedWays.begin() );
		std::vector<Way*>::iterator last_way(document->m_SplittedWays.end() );	
		while (it_way != last_way)
		{
			Way* way = *it_way++;
			test.exportWay(way, config->m_edge, config->m_vertex);
//			document->m_SplittedWays.erase(it_way);
//			it_way++;
		}*/
		cerr << "Create topology" << endl;
		test.createTopology();
	}
	
	cerr << "Finished" << endl;

	return 0;
}

