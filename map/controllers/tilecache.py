import time
import email
from ConfigParser import NoOptionError
from pylons import config
from TileCache.Service import Service, wsgiHandler

from map.lib.base import BaseController

# default expiration time is set to 1 year
DEFAULT_EXPIRATION = 3600*24*365

class TilecacheController(BaseController):

    service = Service.load(config.get('tilecache.cfg'))

    def tilecache(self, environ, start_response):
        try:
            expiration = self.service.config.getint('cache', 'expire')
        except NoOptionError:
            expiration = DEFAULT_EXPIRATION

        # custom_start_response adds cache headers to the response
        def custom_start_response(status, headers, exc_info=None):
            headers.append(('Cache-Control', 'public, max-age=%s'
                % expiration))
            headers.append(('Expires', email.Utils.formatdate(
                time.time() + expiration, False, True)))
            return start_response(status, headers, exc_info)

        return wsgiHandler(environ, custom_start_response, self.service)
