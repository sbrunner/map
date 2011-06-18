#!/usr/bin/python
from subprocess import call
import sys, os
from Queue import Queue
import mapnik
import threading

# Default number of rendering threads to spawn, should be roughly equal to number of CPU cores available
NUM_THREADS = 4
TILES_SIZE = 1024
RESOLUTIONS = [1000,500,250,100,50,20,10,5,2,1,0.5]
BOUNDS = [420000, 30000, 900000, 350000]

def minmax (a,b,c):
    a = max(a,b)
    a = min(a,c)
    return a


def fromPixelToM(px0, px1, zoom):
     r = RESOLUTIONS[zoom]
     x0 = px0[0] * r + BOUNDS[0]
     y0 = px0[1] * r + BOUNDS[1]
     x1 = px1[0] * r + BOUNDS[0]
     y1 = px1[1] * r + BOUNDS[1]
     return (x0, y0, x1, y1)

class RenderThread:
    def __init__(self, tile_dir, mapfile, q, printLock, maxZoom, tms_scheme=False):
        self.tile_dir = tile_dir
        self.q = q
        self.m = mapnik.Map(TILES_SIZE, TILES_SIZE)
        self.printLock = printLock
        self.tms_scheme = tms_scheme
        # Load style XML
        mapnik.load_map(self.m, mapfile, True)


    def render_tile(self, tile_uri, x, y, z):

        # flip y to match OSGEO TMS spec
        if self.tms_scheme:
            y = (2**z-1) - y

        # Calculate pixel positions of bottom-left & top-right
        p0 = (x * TILES_SIZE, (y + 1) * TILES_SIZE)
        p1 = ((x + 1) * TILES_SIZE, y * TILES_SIZE)

        # Convert to map projection (e.g. mercator co-ords EPSG:900913)
        bbox = fromPixelToM(p0, p1, z)
        self.m.resize(TILES_SIZE, TILES_SIZE)
        self.m.zoom_to_box(bbox)
        self.m.buffer_size = 128

        # Render image with default Agg renderer
        im = mapnik.Image(TILES_SIZE, TILES_SIZE)
        mapnik.render(self.m, im)
        im.save(tile_uri, 'png256')


    def loop(self):
        while True:
            #Fetch a tile from the queue and render it
            r = self.q.get()
            if (r == None):
                self.q.task_done()
                break
            else:
                (name, tile_uri, x, y, z) = r

            exists= ""
            if os.path.isfile(tile_uri):
                exists= "exists"
            else:
                self.render_tile(tile_uri, x, y, z)
            bytes=os.stat(tile_uri)[6]
            empty= ''
            if bytes == 116:
            #if bytes == 103:
                empty = " Empty Tile "
                os.remove(tile_uri)
            self.printLock.acquire()
            print name, ":", z, x, y, exists, empty
            self.printLock.release()
            self.q.task_done()



def render_tiles(bbox, mapfile, tile_dir, minZoom=1,maxZoom=18, name="unknown", num_threads=NUM_THREADS, tms_scheme=False):
    print "render_tiles(",bbox, mapfile, tile_dir, minZoom,maxZoom, name,")"

    # Launch rendering threads
    queue = Queue(32)
    printLock = threading.Lock()
    renderers = {}
    for i in range(num_threads):
        renderer = RenderThread(tile_dir, mapfile, queue, printLock, maxZoom, tms_scheme=tms_scheme)
        render_thread = threading.Thread(target=renderer.loop)
        render_thread.start()
        #print "Started render thread %s" % render_thread.getName()
        renderers[i] = render_thread

    if not os.path.isdir(tile_dir):
         os.mkdir(tile_dir)

    gprj = GoogleProjection(maxZoom+1) 

    ll0 = (bbox[0],bbox[3])
    ll1 = (bbox[2],bbox[1])

    for z in range(minZoom,maxZoom + 1):
        px0 = gprj.fromLLtoPixel(ll0,z)
        px1 = gprj.fromLLtoPixel(ll1,z)

        # check if we have directories in place
        zoom = "%s" % z
        if not os.path.isdir(tile_dir + zoom):
            os.mkdir(tile_dir + zoom)
        for x in range(int(px0[0]/256.0),int(px1[0]/256.0)+1):
            # Validate x co-ordinate
            if (x < 0) or (x >= 2**z):
                continue
            # check if we have directories in place
            str_x = "%s" % x
            if not os.path.isdir(tile_dir + zoom + '/' + str_x):
                os.mkdir(tile_dir + zoom + '/' + str_x)
            for y in range(int(px0[1]/256.0),int(px1[1]/256.0)+1):
                # Validate x co-ordinate
                if (y < 0) or (y >= 2**z):
                    continue
                str_y = "%s" % y
                tile_uri = tile_dir + zoom + '/' + str_x + '/' + str_y + '.png'
                # Submit tile to be rendered into the queue
                t = (name, tile_uri, x, y, z)
                try:
                    queue.put(t)
                except KeyboardInterrupt:
                    raise SystemExit("Ctrl-c detected, exiting...")

    # Signal render threads to exit by sending empty request to queue
    for i in range(num_threads):
        queue.put(None)
    # wait for pending rendering jobs to complete
    queue.join()
    for i in range(num_threads):
        renderers[i].join()



if __name__ == "__main__":
    mapfile = "adrs.osm"
    tile_dir = "/home/tiles/adrs/"

#    bbox = (485869.5728, 76443.1884, 837076.5648, 299941.7864)
#    bbox = (5.9700, 45.8300, 10.4900, 47.8100)
#    bbox = (723000,5844000,773000,5894000)
#    bbox = (6, 46.5, 7, 47)
    bbox = (5.8, 45.7, 10.6, 47.9)

    render_tiles(bbox, mapfile, tile_dir, 1, 18, "Suisse")

