from pylons import request, response, session, tmpl_context as c
from pylons.controllers.util import abort, redirect

from sqlalchemy import Table, Column, MetaData, types
from geoalchemy import *
from mapfishapp.model import cyclerouting

from mapfishapp.lib.base import BaseController
from mapfishapp.model.meta import Session

from mapfish.protocol import Protocol, create_default_filter
from mapfish.decorators import geojsonify

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine('postgresql://pgrouting:pgrouting@localhost:5432/pgrouting', echo=True)

metadata = MetaData()
ways_table = Table('ways', metadata,
        Column('gid', types.Integer, primary_key=True),
        Column('the_geom', Geometry(srid=4326)))

metadata.create_all(engine) 

session = sessionmaker(bind=engine)

class CycleroutingController(BaseController):
    def index(self):
        # find the nearest node
        source = self._nearestEdge(request.params['source']).source
        target = self._nearestEdge(request.params['target']).target
        # defines the shortest path function result
        sp_result_type = [column('vertex_id'), column('edge_id'), column('cost')]
        # the shortest path function 
        sp_func = "SELECT * FROM shortest_path_astar('SELECT gid as id, source, target, x1, y1, x2, y2, \
                length * 0.005 * exp(altitude_diff / length * 0.01) AS cost, \
                length * 0.005 * exp(-altitude_diff / length * 0.01) AS reverse_cost FROM ways', \
                source, target, true, true)"

        # query the database
        route = g.routing_engine.execute(select(sp_result_type, from_obj=sp_func))
#        ways = model.Session.query(Way).filter(Way.gid.in_([i.edge_id for i in route]))
#        result = FeatureCollection([line.toFeature() for line in ways if line])
        return dumps(route)
        
    def _nearestEdge(self, wkt):
        distance = functions.distance(ways_table.c.the_geom, "ST_GeomFromText('" + wkt + "', 4326)").label('dist')
        # find the nearest way
        return session.query(ways_table, distance).order_by('dist')
