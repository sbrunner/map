#from epfl.lib.base import *

from map.model import Session
from map.model.routing import RoutingEdge
from map.lib.base import BaseController

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

            if edge.name == None:
                name = edge.highway
            else:
                name = edge.name
            features.append(Feature(
                id = edge.id,
                geometry = wkb.loads(str(edge.the_geom.geom_wkb)),
                properties = {
                    "id"; id,
                    "name": name,
                    "time": costs[i-1],
                    "waylength": float(edge.length),
                    "elevation": edge.altitude_diff
                }
            ));

        features.append(Feature(id = 0,
                properties = {'distance': distance, 'time': time, 'timeUnit': 's'}))
        return features


    def _shortestPath(self, start, end, options={}):
        """ returns an ordered array of nodes """

        steps = shortest_path_astar(Session, "SELECT * FROM edges", start, end, True, True)

        edge_ids = []
        costs = []
        for step in steps:
            edge_ids.append(step.edge_id)
            costs.append(step.cost)
            
        # gets only name highway altitide diff length
        edges = Session.query(RoutingEdge.id, RoutingEdge.name, RoutingEdge.highway, RoutingEdge.length, RoutingEdge.altitude_diff, RoutingEdge.the_geom).filter(RoutingEdge.id.in_(edge_ids)).all()

        # reorder edges list according to edge_ids
        order_map = dict([(v,k) for (k,v) in enumerate(edge_ids)])
        edges.sort(key=lambda v: order_map[v.id])

        return (edges, costs, steps.rowcount)
