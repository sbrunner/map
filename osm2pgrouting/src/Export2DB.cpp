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

Export2DB::Export2DB()
{
}

Export2DB::~Export2DB()
{
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
    {
        std::string query("CREATE TABLE ways (gid int4, source int4, target int4, altitude_diff double precision, x1 double precision, y1 double precision, x2 double precision,y2 double precision, rule text, PRIMARY KEY(gid)");
        query += getCollumns(edge, "");
        query += getCollumns(vertex, "source_");
        query += getCollumns(vertex, "target_");
        query += std::string(");");
        std::cout << query << std::endl;
        query = "SELECT AddGeometryColumn('ways','the_geom',4326,'MULTILINESTRING',2);";
        std::cout << query << std::endl;
        std::cerr << "Ways table created" << std::endl;
    }
}

void Export2DB::dropTables()
{
    std::cout << "DROP TABLE IF EXISTS ways;" << std::endl;
    std::cout << "DROP TABLE IF EXISTS nodes;" << std::endl;
}

void Export2DB::exportWay(Way* way, std::set<std::string> edge, std::set<std::string> vertex)
{
    char source_id[20];
    char target_id[20];
    
    double altitude_diff = 0;
    Node* front = way->m_NodeRefs.front();
    Node* back = way->m_NodeRefs.back();
    {
        sprintf(source_id, "%lld", front->nid);
        sprintf(target_id, "%lld", back->nid);        
        if (front->ele != -99999 && back->ele != -99999) {
            altitude_diff = back->ele - front->ele;
        }
    }
    std::string query = "INSERT into ways(gid, source, target, altitude_diff, x1, y1, x2, y2, the_geom";
    for (std::set<std::string>::iterator it = edge.begin(); it != edge.end(); it++) {
        query += ", \"" + *it + "\"";
    }
    for (std::set<std::string>::iterator it = vertex.begin(); it != vertex.end(); it++) {
        query += ", \"source_" + *it + "\"";
        query += ", \"target_" + *it + "\"";
    }
    query += ") values (";
    
    query += boost::lexical_cast<std::string>(way->nid) + ","
	     + boost::lexical_cast<std::string>(source_id) + "," + boost::lexical_cast<std::string>(target_id) + ","
	     + boost::lexical_cast<std::string>(altitude_diff) + "," 
	     + boost::lexical_cast<std::string>(way->m_NodeRefs.front()->lon) + "," + boost::lexical_cast<std::string>(way->m_NodeRefs.front()->lat) + ","
	     + boost::lexical_cast<std::string>(way->m_NodeRefs.back()->lon)  + "," + boost::lexical_cast<std::string>(way->m_NodeRefs.back()->lat) + ",";

    query += "GeometryFromText('MULTILINESTRING((";
    std::vector<Node*>::const_iterator it_node(way->m_NodeRefs.begin());	
    std::vector<Node*>::const_iterator last_node(way->m_NodeRefs.end());
    bool first = true;
    while (it_node != last_node) {
	if (first) {
	    first = false;
	}
	else {
	    query += ",";
	}
	Node* node = *it_node++;
	query += boost::lexical_cast<std::string>(node->lon) + " " + boost::lexical_cast<std::string>(node->lat);
    }
    query += "))', 4326)";

    for (std::set<std::string>::iterator it = edge.begin(); it != edge.end(); it++) {
        query += ", '" + boost::algorithm::replace_all_copy(way->m_attributes[*it], "'", "''") + "'";
    }
    for (std::set<std::string>::iterator it = vertex.begin(); it != vertex.end(); it++) {
        query += ", '" + boost::algorithm::replace_all_copy(front->m_attributes[*it], "'", "''") + "'";
        query += ", '" + boost::algorithm::replace_all_copy(back->m_attributes[*it], "'", "''") + "'";
    }
    query += ");";
    std::cout << query <<std::endl;
}

void Export2DB::createTopology()
{
/*    std::cout << "ALTER TABLE ways ADD COLUMN source int4;" <<std::endl;
    std::cout << "ALTER TABLE ways ADD COLUMN target int4;" <<std::endl;
    std::cout << "CREATE INDEX source_idx ON ways(source);" <<std::endl;
    std::cout << "CREATE INDEX target_idx ON ways(target);" <<std::endl;
    std::cout << "CREATE INDEX geom_idx ON ways USING GIST(the_geom GIST_GEOMETRY_OPS);" <<std::endl;
    std::cout << "SELECT assign_vertex_id('ways', 0.00001, 'the_geom', 'gid');" <<std::endl;*/
    std::cout << "VACUUM FULL ANALYZE;" <<std::endl;
}
