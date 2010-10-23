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
#include <stdlib.h>

namespace osm
{

    Configuration::Configuration()
    {
    }

    Configuration::~Configuration()
    {
    }
    
    void Configuration::addEdge(std::string edge)
    {
        std::cerr << "Insert edge: " << edge << std::endl;
        m_edge.insert(edge);
    }
    void Configuration::addVertex(std::string vertex)
    {
        std::cerr << "Insert vertex: " << vertex << std::endl;
        m_vertex.insert(vertex);
    }

    bool Configuration::containsEdge(std::string edge) {
        return m_edge.find(edge) != m_edge.end();
/*        std::list<std::string>::iterator e = m_edge.begin();
        while (e != m_edge.end()) {
            if (e->compare(edge) == 0) {
                return true;
            }
        }
        return false;*/
    }
    bool Configuration::containsVertex(std::string vertex) {
        return m_vertex.find(vertex) != m_vertex.end();
/*        std::list<std::string>::iterator e = m_vertex.begin();
        while (e != m_vertex.end()) {
            if (e->compare(vertex) == 0) {
                return true;
            }
        }
        return false;*/
    }

} // end namespace osm
