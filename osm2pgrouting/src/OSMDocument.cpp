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
#include "OSMDocument.h"
#include "Configuration.h"
#include "Node.h"
#include "Way.h"
#include "math_functions.h"


namespace osm
{

OSMDocument::OSMDocument( Configuration& config ) : m_rConfig( config )
{
}

OSMDocument::~OSMDocument()
{
	ez_mapdelete( m_Nodes );
	ez_vectordelete( m_Ways );		
	ez_vectordelete( m_SplittedWays );
}
void OSMDocument::AddNode( Node* n )
{
	m_Nodes[n->id] = n;
}

void OSMDocument::AddWay( Way* w )
{
	m_Ways.push_back( w );
}

Node* OSMDocument::FindNode( long long nodeRefId ) 
const
{
	std::map<long long, Node*>::const_iterator  it = m_Nodes.find( nodeRefId );
	return (it != m_Nodes.end() ) ? it->second : 0;
}

void OSMDocument::SplitWays()
{
	
//	std::vector<Way*>::const_iterator it(m_Ways.begin());
//	std::vector<Way*>::const_iterator last(m_Ways.end());

	//splitted ways get a new ID
	long long id=0;

//	while(it!=last)
//	{
//		Way* currentWay = *it++;
	while (!m_Ways.empty()) {
		Way* currentWay = m_Ways.back();
		
		std::vector<Node*>::const_iterator it_node( currentWay->m_NodeRefs.begin());	
		std::vector<Node*>::const_iterator last_node( currentWay->m_NodeRefs.end());
		
		Node* backNode = currentWay->m_NodeRefs.back();



		while(it_node!=last_node)
		{
			
			Node* node = *it_node++;
			Node* secondNode=0;
			Node* lastNode=0;
			
			Way* splitted_way = new Way(++id);
			splitted_way->m_attributes = currentWay->m_attributes;

			splitted_way->AddNodeRef(node);
			
			bool found=false;
			
			if(it_node!=last_node)
			{
				while(it_node!=last_node && !found)
				{
					splitted_way->AddNodeRef(*it_node);
					if((*it_node)->numsOfUse>1)
					{
						found=true;
						secondNode = *it_node;
						splitted_way->AddNodeRef(secondNode);
					}
					else if(backNode==(*it_node))
					{
						lastNode=*it_node++;
						splitted_way->AddNodeRef(lastNode);
					}
					else
					{
						*it_node++;
					}
				}
			}
				
			if(splitted_way->m_NodeRefs.front()!=splitted_way->m_NodeRefs.back())
				m_SplittedWays.push_back(splitted_way);
			else
			{
				delete splitted_way;
				splitted_way=0;
			}
				
		}

		m_Ways.pop_back();
		delete currentWay;
	}

} // end SplitWays

} // end namespace osm
