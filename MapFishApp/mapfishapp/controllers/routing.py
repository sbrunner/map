#from epfl.lib.base import *

from mapfishapp.model import Session
from mapfishapp.model.routing import RoutingEdge
from mapfishapp.lib.base import BaseController

from mapfish.plugins.pgrouting import shortest_path

from shapely.geometry import LineString, Point
from shapely import wkb, wkt
from geoalchemy.postgis import *
from geojson import Feature, FeatureCollection, dumps
from sqlalchemy.sql.expression import func
from pylons import request, response

from wsgiref import headers

import logging
log = logging.getLogger(__name__)

def shortest_path_astar(engine, sql, source_id, target_id,
                        directed = False, has_reverse_cost = False):

    return engine.execute("SELECT * FROM \
                           shortest_path_astar('%(sql)s', %(source_id)s, %(target_id)s, \
                                               %(directed)s, %(has_reverse_cost)s)"
                          %{'sql': sql.replace("'", "''"),
                            'source_id': source_id,
                            'target_id': target_id,
                            'directed': directed,
                            'has_reverse_cost': has_reverse_cost}
                          )

class RoutingController(BaseController):

    def index(self):
        lang = request.params.get('lang', 'en')
        start_node = self._nearestVertex(request.params['source'])
        end_node = self._nearestVertex(request.params['target'])

        # FIXME: validate start_node and end_node

        edges, costs, rowcount = self._shortestPath(start_node, end_node)
        if not edges:
            return dumps({'success': False,
                          'msg': "No path from '%s' to '%s'"%(start_node, end_node)})
        else:
            features = self._roadmap(edges, costs, rowcount)
            dump = dumps(FeatureCollection(features))
            if request.params.get('callback') != None:
                response.headers['Content-Type'] = 'text/javascript; charset=utf-8'
                return "%s(%s);"%(request.params.get('callback'), dump)
            else:
                response.headers['Content-Type'] = 'application/json; charset=utf-8'
                return dump

    def _nearestVertex(self, wktPoint):
        distance = functions.distance(RoutingEdge.the_geom, wktPoint).label('dist')
        edge = Session.query(RoutingEdge.source, RoutingEdge.target).add_column(distance) \
                .add_column(RoutingEdge.x1).add_column(RoutingEdge.y1).add_column(RoutingEdge.x2).add_column(RoutingEdge.y2) \
                .order_by('dist').first()
        point = wkt.loads(wktPoint)
        source = Point(edge.x1, edge.y1)
        target = Point(edge.x2, edge.y2)
        if point.distance(source) < point.distance(target) :
            return edge.source
        else:
            return edge.target

    def _roadmap(self, edges, costs, rowcount):
        """ returns the roadmap """
        features = []
        roadmap = []
        distance = 0.0
        time = 0.0
        
        for i in range(rowcount):
            edge = edges[i-1]
            
            distance += float(edge.length)
            time += float(costs[i-1])

#            name = edge.highway
            if edge.name == None:
                name = edge.highway
            else:
                name = edge.name
            features.append(Feature(
                id = edge.gid,
                geometry = wkb.loads(str(edge.the_geom.geom_wkb)),
                properties = {
                    "name": name,
                    "time": costs[i-1],
                    "waylength": float(edge.length),
                    "elevation": edge.altitude_diff
                }
            ));
#            roadmap.append(Feature(id=edge.gid,
##                   geometry=Point(edge.x1, edge.y1),
#                   properties={'name': edge.name, 'highway': edge.highway, 'distance': distance, 'time': time}))

        features.append(Feature(id = 0,
                properties = {'distance': distance, 'time': time, 'timeUnit': 's'}))
        return features


    def _shortestPath(self, start, end, options={}):
        """ returns an ordered array of nodes """

        booth_speed = """ *
(case bicycle 
when 'yes' then 1
when 'designated' then 1
when 'official' then 1
when 'destination' then 50
when 'agricultural' then 9999 
when 'forestry' then 9999
when 'delivery' then 9999
when 'permissive' then 9999
when 'private' then 9999
when 'no' then 9999
else (case access
when 'yes' then 1
when 'designated' then 1
when 'official' then 1
when 'destination' then 50
when 'agricultural' then 9999
when 'forestry' then 9999
when 'delivery' then 9999
when 'permissive' then 9999
when 'private' then 9999
when 'no' then 9999
else 1
end)
end) *
(case highway
when 'motorway' then 9999
when 'trunk' then 9999
when 'primary' then 1.015
when 'secondary' then 1.01
when 'tertiary' then 1.005
when 'residential' then 1
when 'unclassified' then 1
when 'service' then 1.015
when 'pedestrian' then 1.01
when 'cycleway' then 0.9
when 'footway' then 2
when 'path' then 1.05
when 'steps' then 7
when 'track' then 
(case tracktype
when 'grade1' then 1.1
when 'grade2' then 1.2
when 'grade3' then 1.5
when 'grade4' then 1.9
when 'grade5' then 2.5
else 1.5
end)
when 'road' then 1
else 9999
end) *
(case "mtb:scale" 
when '0' then 1
when '1' then 1.5
when '2' then 2
when '3' then 3
when '4' then 4.3
when '5' then 6
else (case sac_scale
when 'hiking' then 1.2
when 'mountain_hiking' then 3
when 'demanding_mountain_hiking' then 6
when 'alpine_hiking'  then 12
when 'demanding_alpine_hiking'  then 24
when 'difficult_alpine_hiking'  then 48
else 1.2
end)
end) *
(case trail_visibility 
when 'excellent' then 1
when 'good' then 1.1
when 'intermediate' then 1.3
when 'bad' then 1.8
when 'horrible' then 2.5
when 'no' then 4
else 1.1
end)
"""
        booth_fixed = """ +
(case source_highway
when 'mini_roundabout' then 1
when 'stop' then 1
when 'give_way' then 1
when 'traffic_signals' then 7
when 'crossing' then 1
else 0
end) +
(case target_highway
when 'mini_roundabout' then 1
when 'stop' then 1
when 'give_way' then 1
when 'traffic_signals' then 7
when 'crossing' then 1
else 0
end)
"""
        speed = """(case cycleway
when 'lane' then 1.05
when 'track' then 1.1
else 1
end) * 
(case oneway when '-1' then 9999 else 1
end) 
""" + booth_speed

        reversespeed = """(case cycleway
when 'lane' then 1.05 * (case oneway 
when 'yes' then 9999
when '1' then 9999
when 'true' then 9999 
else 1
end)
when 'track' then 1.1 * (case oneway 
when 'yes' then 9999
when '1' then 9999
when 'true' then 9999 
else 1
end)
when 'opposite_lane' then 1.05
when 'opposite_track' then 1.1
when 'opposite' then 1.1
else (case oneway 
when 'yes' then 9999
when '1' then 9999
when 'true' then 9999 
else 1
end)
end) 
""" + booth_speed

        diffSpeed = "case when altitude_diff > 0 then exp(altitude_diff / length * 0.012) else exp(altitude_diff / length * 0.009) end * length * 200 * "
        reversediffSpeed = "case when altitude_diff < 0 then exp(-altitude_diff / length * 0.012) else exp(-altitude_diff / length * 0.009) end * length * 200 * "

        cost = diffSpeed + "replaceOverMax(" + speed + ", 100, -1)" + booth_fixed
        reversecost = reversediffSpeed + "replaceOverMax(" + reversespeed + ", 100, -1)" + booth_fixed

        """steps = shortest_path_astar(Session,
                              "SELECT gid AS id,              \
                                      source,       \
                                      target,       \
                                      (%(cost)s)::float8 AS cost, \
                                      (%(reversecost)s)::float8 AS reverse_cost, \
                                      x1, y1, x2, y2              \
                                      FROM ways"%{'cost': cost, 'reversecost': reversecost},
                              start, end, True, True)
                              """
        steps = shortest_path_astar(Session, "SELECT * FROM edges", start, end, True, True)


        edge_ids = []
        costs = []
        for step in steps:
            edge_ids.append(step.edge_id)
            costs.append(step.cost)
            
        # gets only name highway altitide diff length
        edges = Session.query(RoutingEdge.gid, RoutingEdge.name, RoutingEdge.highway, RoutingEdge.length, RoutingEdge.altitude_diff, RoutingEdge.the_geom).filter(RoutingEdge.gid.in_(edge_ids)).all()
        """
                    if edge.name == None:
                name = edge.highway
            else:
                name = edge.name
            features.append(Feature(
                id = edge.gid,
                geometry = wkb.loads(str(edge.the_geom.geom_wkb)),
                properties = {
                    "name": name,
                    "time": costs[i-1],
                    "waylength": float(edge.length),
                    "elevation": edge.altitude_diff
                }
"""
        # reorder edges list according to edge_ids
        order_map = dict([(v,k) for (k,v) in enumerate(edge_ids)])
        edges.sort(key=lambda v: order_map[v.gid])

        return (edges, costs, steps.rowcount)
