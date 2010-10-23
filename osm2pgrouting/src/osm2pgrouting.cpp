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
				cerr << "-dbname <dbname> -- name of your database" << endl;
				cerr << "-user <user> -- name of the user, which have write access to the database" << endl;
				cerr << "optional:" << endl;
				cerr << "-host <host>  -- host of your postgresql database (default: 127.0.0.1)" << endl;
				cerr << "-port <port> -- port of your database (default: 5432)" << endl;
				cerr << "-passwd <passwd> --  password for database access" << endl;
				cerr << "-clean -- drop peviously created tables" << endl;
					
}

int main(int argc, char* argv[])
{
	std::string file;
	std::string cFile;
	std::string host="127.0.0.1";
	std::string user;
	std::string port="5432";
	std::string dbname;
	std::string passwd;
	bool clean = false;
	if(argc >=7 && argc <=13)
	{
		int i=1;
		while( i<argc)
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
				
			else if(strcmp(argv[i],"-host")==0)
			{
				i++;
				host = argv[i];
			}
			else if(strcmp(argv[i],"-dbname")==0)
			{
				i++;
				dbname = argv[i];
			}
			else if(strcmp(argv[i],"-user")==0)
			{
				i++;
				user = argv[i];
			}
			else if(strcmp(argv[i],"-port")==0)
			{
				i++;
				port = argv[i];
			}
			else if(strcmp(argv[i],"-passwd")==0)
			{
				i++;
				passwd = argv[i];
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
		
	}
	else
	{
		_error();
		return 1;
	}
	
	if(file.empty() || cFile.empty() || dbname.empty() || user.empty())
	{
		_error();
		return 1;
	}
	
	Export2DB test(host, user, dbname, port, passwd);
	if(test.connect()==1)
		return 1;


	XMLParser parser;
	
	cerr << "Trying to load config file " << cFile.c_str() << endl;

	Configuration* config = new Configuration();
        ConfigurationParserCallback cCallback( *config );

	cerr << "Trying to parse config" << endl;

	int ret = parser.Parse( cCallback, cFile.c_str() );
	if( ret!=0 ) return 1;

	cerr << "Trying to load data" << endl;

	OSMDocument* document = new OSMDocument( *config );
        OSMDocumentParserCallback callback( *document );

	cerr << "Trying to parse data" << endl;

	ret = parser.Parse( callback, file.c_str() );
	if( ret!=0 ) return 1;
	
	cerr << "Split ways" << endl;

	document->SplitWays();
	//############# Export2DB
	{

		if( clean )
		{
			test.dropTables();
		}
		
		test.createTables(config->m_edge, config->m_vertex);
		
		std::map<long long, Node*>::iterator it(document->m_Nodes.begin());
		std::map<long long, Node*>::iterator last(document->m_Nodes.end());
		
		while (it != last)
		{
			Node* node = (*it++).second;
			test.exportNode(node, config->m_vertex);
		}
		
		cerr << "Nodes created" << endl;
		std::vector<Way*>::iterator it_way(document->m_SplittedWays.begin() );
		std::vector<Way*>::iterator last_way(document->m_SplittedWays.end() );	
		while (it_way != last_way)
		{
			Way* way = *it_way++;
			test.exportWay(way, config->m_edge, config->m_vertex);
		}
		cerr << "create topology" << endl;
		test.createTopology();
	}
	
	cerr << "#########################" << endl;
	
	cerr << "size of streets: " << document->m_Ways.size() <<	endl;
	cerr << "size of splitted ways : " << document->m_SplittedWays.size() <<	endl;

	cerr << "finished" << endl;

	//string n;
	//getline( cin, n );
	return 0;
}

