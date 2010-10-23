/***************************************************************************
 *   Copyright (C) 2008 by Daniel Wendt                                    *
 *   gentoo.murray@gmail.com                                               *
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
 
#ifndef CONFIGURATION_H
#define CONFIGURATION_H

#include <set>

namespace osm
{
    template<class Map>
    inline void ez_mapdelete(Map& c)
    {
        typename Map::iterator it(c.begin());
        typename Map::iterator last(c.end());
        while (it != last)
        {
            delete (*it++).second;
        }
    }

    template<class Vector>
    inline void ez_vectordelete(Vector& c)
    {
        typename Vector::iterator it(c.begin());
        typename Vector::iterator last(c.end());
        while (it != last)
        {
            delete (*it++);
        }
    }
    
    /**
     * A configuration document.
     */
    class Configuration
    {
    public:
        //! Map, which saves the parsed types
        std::set<std::string> m_edge;
        std::set<std::string> m_vertex;
    public:

        //! Constructor
        Configuration();
        //! Destructor
        virtual ~Configuration();

        void addEdge(std::string edge);
        void addVertex(std::string vertex);
        
        bool containsEdge(std::string edge);
        bool containsVertex(std::string vertex);
    };

} // end namespace osm
#endif
