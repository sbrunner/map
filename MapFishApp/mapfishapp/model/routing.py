#from epfl.lib.base import *

from sqlalchemy import Column, types
from geoalchemy import GeometryColumn, Geometry
#from sqlalchemy.ext.declarative import declarative_base

from geoalchemy import Geometry

from mapfish.sqlalchemygeom import GeometryTableMixIn
from mapfishapp.model.meta import Session, Base

# Include the '_' function in the public names
__all__ = [__name for __name in locals().keys() if not __name.startswith('_') \
           or __name == '_']
           
           
#class RoutingVertex(Base, GeometryTableMixIn):
#    __tablename__ = 'nodes'
#    __table_args__ = {
#        "autoload": True,
#        "autoload_with": Session.bind
#    }
##    the_geom = GeometryColumn(Geometry(srid=4326))
##    the_geom = Column(Geometry(4326))

#    @property
#    def coords(self):
#        return self.the_geom.x, self.the_geom.y

class RoutingEdge(Base, GeometryTableMixIn):
    __tablename__ = 'ways'
#    __table_args__ = ({'autoload': True})
    __table_args__ = {
        "autoload": True,
        "autoload_with": Session.bind
    }
    the_geom = GeometryColumn(Geometry(srid=4326))
#    the_geom = Column(Geometry(4326))
