from sqlalchemy import Column, types

from geoalchemy import GeometryColumn, Geometry

from mapfish.sqlalchemygeom import GeometryTableMixIn
from mapfishapp.model.meta import Session, Base

class Routing2(Base, GeometryTableMixIn):
    __tablename__ = 'nodes'
    __table_args__ = {
        "autoload": True,
        "autoload_with": Session.bind
    }
    the_geom = GeometryColumn(Geometry(srid=4326))
