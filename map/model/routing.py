from sqlalchemy import Column, types
from geoalchemy import GeometryColumn, Geometry

from geoalchemy import Geometry

from mapfish.sqlalchemygeom import GeometryTableMixIn
from map.model.meta import Session, Base

# Include the '_' function in the public names
__all__ = [__name for __name in locals().keys() if not __name.startswith('_') \
           or __name == '_']
           
class RoutingEdge(Base, GeometryTableMixIn):
    __tablename__ = 'ways'
    __table_args__ = {
        "autoload": True,
        "autoload_with": Session.bind
    }
    the_geom = GeometryColumn(Geometry(srid=4326))
