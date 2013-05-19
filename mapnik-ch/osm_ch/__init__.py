# -*- coding: utf-8 -*-

from pyramid.config import Configurator

class Root(object):
    def __init__(self, request):
        self.request = request

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    config = Configurator(root_factory=Root, settings=settings)
    
    config.add_route('serve_tiles', '/tiles/*path')
    config.add_view('tilecloud_chain.views.serve:Serve', route_name='serve_tiles')

    config.add_static_view('map', 'osm_ch:static')

    # scan view decorator for adding routes
    config.scan()

    return config.make_wsgi_app()
