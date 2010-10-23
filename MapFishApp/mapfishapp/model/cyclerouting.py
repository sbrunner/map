"""from sqlalchemy import Column, types

from geoalchemy import GeometryColumn, Geometry

from mapfish.sqlalchemygeom import GeometryTableMixIn
from mapfishapp.model.meta import Session, Base

class Routing(Base, GeometryTableMixIn):
    __tablename__ = 'vertices_tmp'
    __table_args__ = {
        "autoload": True,
        "autoload_with": Session.bind,
        "useexisting": True
    }
    id = Column(types.Integer, primary_key=True)
    the_geom = GeometryColumn(Geometry(srid=4326))
    useexisting = True


"""
from sqlalchemy import Table, Column, MetaData, types
from sqlalchemy.orm import mapper
from geoalchemy import GeometryColumn
from geoalchemy import *

from mapfish.sqlalchemygeom import GeometryTableMixIn
from mapfishapp.model.meta import Session, Base

""",
metadata = MetaData()
ways_table = Table('ways', metadata,
        Column('gid', types.Integer, primary_key=True),
        Column('the_geom', Geometry(srid=4326)))

Column('length', types.Integer),
Column('altitude_diff', types.Integer),
GeometryColumn('the_geom', Geometry(srid=4326)),
Column('source', types.Integer),
Column('target', types.Integer),
Column('x1', types.Integer),
Column('y1', types.Integer),
Column('x2', types.Integer),
Column('y2', types.Integer),
Column('name', types.String),
Column('rule', types.String),
Column('access', types.String),
Column('bicycle', types.String),
Column('cycleway', types.String),
Column('highway', types.String),
Column('mtb:scale', types.String),
Column('oneway', types.String),
Column('sac_scale', types.String),
Column('tail_visibility', types.String),
Column('tracktype', types.String))
"""
 
"""nodes_table = Table('nodes', metadata,
        Column('id', types.Integer, primary_key=True),
        Column('lon', types.Integer),
        Column('lat', types.Integer),
        Column('numofuse', types.Integer),
        Column('ele', types.String),
        Column('highway', types.String))

class Way(GeometryTableMixIn):
     __table__ = ways_table

class Node(GeometryTableMixIn):
     __table__ = nodes_table
"""
