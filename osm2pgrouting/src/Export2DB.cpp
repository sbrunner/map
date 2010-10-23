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
#include "Export2DB.h"

using namespace std;

Export2DB::Export2DB(std::string host, std::string user, std::string dbname, std::string port, std::string passwd)
:mycon(0)
{
	
this->conninf="host="+host+" user="+user+" dbname="+ dbname +" port="+port;
if(!passwd.empty())
	this->conninf+=" password="+passwd;
	
}

Export2DB::~Export2DB()
{
	PQfinish(mycon);
}

int Export2DB::connect()
{
	cerr << conninf<< endl;
	//mycon =PQconnectdb("user=postgres dbname=template1 hostaddr=127.0.0.1 port=5432");
	mycon =PQconnectdb(conninf.c_str());
	
	ConnStatusType type =PQstatus(mycon);
		if(type==CONNECTION_BAD)
		{
			cerr << "connection failed"<< endl;
			return 1;
		}
		else
		{
			cerr << "connection success"<< endl;
			return 0;
		}
/***
      CONNECTION_STARTED: Waiting for connection to be made.
      CONNECTION_MADE: Connection OK; waiting to send.
      CONNECTION_AWAITING_RESPONSE: Waiting for a response from the postmaster.
      CONNECTION_AUTH_OK: Received authentication; waiting for backend start-up.
	  CONNECTION_SETENV: Negotiating environment.
***/

}

std::string Export2DB::getCollumns(std::set<std::string> names, std::string prefix) {
    std::string result = "";    
    for (std::set<std::string>::iterator it = names.begin(); it != names.end(); it++) {
        result += ", \"" + prefix + *it + "\" char(200)";
    }
    return result;
}

void Export2DB::createTables(std::set<std::string> edge, std::set<std::string> vertex)
{
/*    {
        std::string query("CREATE TABLE nodes (ID int4 PRIMARY KEY,  lon decimal(11,8), lat decimal(11,8), numOfUse smallint");
        query += getCollumns(vertex) + std::string(");");
        std::cout << query << std::endl;
//        PGresult* result = PQexec(mycon, query.c_str());
        std::cerr << "Nodes table created" << std::endl;
    }*/
    {
//        std::string query("CREATE TABLE ways (gid int4, source int4, target int4, length double precision, altitude_diff double precision, name char(200), x1 double precision, y1 double precision, x2 double precision,y2 double precision, rule text, PRIMARY KEY(gid)");
        std::string query("CREATE TABLE ways (gid int4, length double precision, altitude_diff double precision, x1 double precision, y1 double precision, x2 double precision,y2 double precision, rule text, PRIMARY KEY(gid)");
        query += getCollumns(edge, "");
        query += getCollumns(vertex, "source_");
        query += getCollumns(vertex, "target_");
        query += std::string(");");
        std::cout << query << std::endl;
        PGresult* result = PQexec(mycon, query.c_str());
        query = "SELECT AddGeometryColumn('ways','the_geom',4326,'MULTILINESTRING',2);";
        std::cout << query << std::endl;
        result = PQexec(mycon, query.c_str());
        std::cerr << "Ways table created" << std::endl;
    }
}

void Export2DB::dropTables()
{
    std::cout << "DROP TABLE ways;" << std::endl;
    std::cout << "DROP TABLE nodes;" << std::endl;
	PGresult *result = PQexec(mycon, "DROP TABLE ways; DROP TABLE nodes;");
}

void Export2DB::exportNode(Node* node, std::set<std::string> vertex)
{
/*	char tmp_id[20];
	char tmp_lon[15];
	char tmp_lat[15];
	
	sprintf(tmp_id, "%lld", node->id);
	gcvt(node->lon, 12, tmp_lon);
	gcvt(node->lat, 12, tmp_lat);
	
    std::string query = "INSERT into nodes(id, lon, lat";
    for (std::set<std::string>::iterator it = vertex.begin(); it != vertex.end(); it++) {
        query += ", \"" + *it + "\"";
    }
	query += ") values(" + std::string(tmp_id) + ", " + std::string(tmp_lon) + ", " + std::string(tmp_lat);
    for (std::set<std::string>::iterator it = vertex.begin(); it != vertex.end(); it++) {
        query += ", '" + node->m_attributes[*it] + "'";
    }
	query += ");";
	
// TODO debug msg
std::cout << query <<std::endl;
//	PGresult *result = PQexec(mycon, query.c_str());*/
}

void Export2DB::exportWay(Way* way, std::set<std::string> edge, std::set<std::string> vertex)
{
	char source_id[20];
	char target_id[20];
    
    double altitude_diff = 0;
    Node* front = way->m_NodeRefs.front();
    Node* back = way->m_NodeRefs.back();
    {
        sprintf(source_id, "%lld", front->id);
        sprintf(target_id, "%lld", back->id);        
//        std::cout << front->ele << " -> " << back->ele << std::endl;
        if (front->ele != -99999 && back->ele != -99999) {
            altitude_diff = back->ele - front->ele;
        }
    }
//	std::string query = "INSERT into ways(gid, source, target, length, altitude_diff, x1, y1, x2, y2, the_geom";
	std::string query = "INSERT into ways(gid, length, altitude_diff, x1, y1, x2, y2, the_geom";
    for (std::set<std::string>::iterator it = edge.begin(); it != edge.end(); it++) {
        query += ", \"" + *it + "\"";
    }
    for (std::set<std::string>::iterator it = vertex.begin(); it != vertex.end(); it++) {
        query += ", \"source_" + *it + "\"";
        query += ", \"target_" + *it + "\"";
    }
	query += ") values (";
	
	query += boost::lexical_cast<std::string>(way->id) + ","
//         + boost::lexical_cast<std::string>(source_id) + "," + boost::lexical_cast<std::string>(target_id) + ","
         + boost::lexical_cast<std::string>(way->length) + "," + boost::lexical_cast<std::string>(altitude_diff) + "," 
		 + boost::lexical_cast<std::string>(way->m_NodeRefs.front()->lon) + "," + boost::lexical_cast<std::string>(way->m_NodeRefs.front()->lat) + ","
		 + boost::lexical_cast<std::string>(way->m_NodeRefs.back()->lon)  + "," + boost::lexical_cast<std::string>(way->m_NodeRefs.back()->lat) + ",";
	query+="GeometryFromText('" + way->geom + "', 4326)";

    for (std::set<std::string>::iterator it = edge.begin(); it != edge.end(); it++) {
        query += ", '" + way->m_attributes[*it] + "'";
    }
    for (std::set<std::string>::iterator it = vertex.begin(); it != vertex.end(); it++) {
        query += ", '" + front->m_attributes[*it] + "'";
        query += ", '" + back->m_attributes[*it] + "'";
    }
	query+=");";
// TODO debug msg
std::cout << query <<std::endl;
	PGresult *result = PQexec(mycon, query.c_str());
}

void Export2DB::createTopology()
{
// TODO debug msg
std::cout << "ALTER TABLE ways ADD COLUMN source int4;" <<std::endl;
	PGresult *result = PQexec(mycon,"ALTER TABLE ways ADD COLUMN source integer;");
std::cout << "ALTER TABLE ways ADD COLUMN target int4;" <<std::endl;
	result = PQexec(mycon,"ALTER TABLE ways ADD COLUMN target integer;");
std::cout << "CREATE INDEX source_idx ON ways(source);" <<std::endl;
	result = PQexec(mycon,"CREATE INDEX source_idx ON ways(source);");
std::cout << "CREATE INDEX target_idx ON ways(target);" <<std::endl;
	result = PQexec(mycon,"CREATE INDEX target_idx ON ways(target);");
std::cout << "CREATE INDEX geom_idx ON ways USING GIST(the_geom GIST_GEOMETRY_OPS);" <<std::endl;
    result = PQexec(mycon,"CREATE INDEX geom_idx ON ways USING GIST(the_geom GIST_GEOMETRY_OPS);");
std::cout << "SELECT assign_vertex_id('ways', 0.00001, 'the_geom', 'gid');" <<std::endl;
	result = PQexec(mycon,"SELECT assign_vertex_id('ways', 0.00001, 'the_geom', 'gid');");
std::cout << "VACUUM FULL VERBOSE ANALYZE;" <<std::endl;
	result = PQexec(mycon,"VACUUM FULL VERBOSE ANALYZE;");
	
}
