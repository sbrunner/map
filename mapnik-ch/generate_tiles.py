#!/usr/bin/python

# sudo -u postgres ./generate_tiles.py

from subprocess import call
import sys, os
from Queue import Queue
import mapnik
import threading

# Default number of rendering threads to spawn, should be roughly equal to number of CPU cores available
NUM_THREADS = 3
TILES_SIZE = 1024
RESOLUTIONS = (1000,500,250,100,50,20,10,5,2,1,0.5)
BOUNDS = (420000, 30000, 900000, 350000)

BOUNDS_ll = (5.13, 45.40, 11.46, 48.24)


def fromPixelToMetre(px0, px1, zoom):
    r = RESOLUTIONS[zoom]
    x0 = BOUNDS[0] + px0[0] * r
    y0 = BOUNDS[3] - px1[1] * r
    x1 = BOUNDS[0] + px1[0] * r
    y1 = BOUNDS[3] - px0[1] * r
    return mapnik.Envelope(x0, y0, x1, y1)

def fromMetreToPixel(bbox, zoom):
    r = RESOLUTIONS[zoom]
    x0 = (bbox[0] - BOUNDS[0]) / r
    y1 = (BOUNDS[3] - bbox[1]) / r
    x1 = (bbox[2] - BOUNDS[0]) / r
    y0 = (BOUNDS[3] - bbox[3]) / r
    return (x0, y0, x1, y1)

class RenderThread:
    def __init__(self, tile_dir, mapfile, q, printLock, maxZoom):
        self.tile_dir = tile_dir
        self.q = q
        self.m = mapnik.Map(TILES_SIZE, TILES_SIZE)
        self.printLock = printLock
        # Load style XML
        mapnik.load_map(self.m, mapfile, True)


    def render_tile(self, tile_uri, x, y, z):

        # Calculate pixel positions of bottom-left & top-right
        p0 = (x * TILES_SIZE, y * TILES_SIZE)
        p1 = ((x + 1) * TILES_SIZE, (y + 1) * TILES_SIZE)
        
        # Convert to map projection (e.g. mercator co-ords EPSG:900913)
        bbox = fromPixelToMetre(p0, p1, z)

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
            if bytes == 222:
            #if bytes == 116:
            #if bytes == 103:
                empty = " Empty Tile "
                os.remove(tile_uri)
            self.printLock.acquire()
            print name, ":", z, x, y, exists, empty
            self.printLock.release()
            self.q.task_done()



def render_tiles(bbox, mapfile, tile_dir, minZoom=1,maxZoom=18, name="unknown", num_threads=NUM_THREADS):
    print "render_tiles(", bbox, mapfile, tile_dir, minZoom ,maxZoom, name,")"

    # Launch rendering threads
    queue = Queue(32)
    printLock = threading.Lock()
    renderers = {}
    for i in range(num_threads):
        renderer = RenderThread(tile_dir, mapfile, queue, printLock, maxZoom)
        render_thread = threading.Thread(target=renderer.loop)
        render_thread.start()
        #print "Started render thread %s" % render_thread.getName()
        renderers[i] = render_thread

    if not os.path.isdir(tile_dir):
         os.mkdir(tile_dir)

    for z in range(minZoom,maxZoom + 1):
        pxbox = fromMetreToPixel(bbox, z)

        # check if we have directories in place
        zoom = "%s" % z
        if not os.path.isdir(tile_dir + zoom):
            os.mkdir(tile_dir + zoom)
        for x in range(int(pxbox[0]/TILES_SIZE),int(pxbox[2]/TILES_SIZE)+1):
            # check if we have directories in place
            str_x = "%s" % x
            if not os.path.isdir(tile_dir + zoom + '/' + str_x):
                os.mkdir(tile_dir + zoom + '/' + str_x)
            for y in range(int(pxbox[1]/TILES_SIZE),int(pxbox[3]/TILES_SIZE)+1):
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
    mapfile = "mapnik.style"
    tile_dir = "/media/BigBackup/tiles/ch/"

    bbox = (420000, 30000, 900000, 350000)

    """
    def getXY(bounds, z):
        maxExtent = (420000, 30000, 900000, 350000)
        serverResolutions = [1000,500,250,100,50,20,10,5,2,1,0.5]

        res = serverResolutions[z];
        x = (bounds[0] - maxExtent[0]) / (res * 1024);
        y = (maxExtent[3] - bounds[1]) / (res * 1024);

        print (x, y)


    x = 0
    y = 0
    z = 1
    p0 = (x * TILES_SIZE, (y + 1) * TILES_SIZE)
    p1 = ((x + 1) * TILES_SIZE, y * TILES_SIZE)
    print (p0, p1) # ((0, 1024), (1024, 0))

    print fromPixelToMetre((0, 1024), (1024, 0), 1) # (420000.0,-162000.0,932000.0,350000.0)
    print fromMetreToPixel((420000.0,30000.0,932000.0,542000.0), 1) # (0.0, 1024.0, 1024.0, 0.0)
    getXY((420000.0,-162000.0,932000.0,350000.0), 1)
    
    print fromPixelToMetre((0, 2048), (1024, 1024), 3) # 420000.0,145200.0,522400.0,247600.0
    print fromMetreToPixel((420000.0,145200.0,522400.0,247600.0), 3) # 
    getXY((420000.0,145200.0,522400.0,247600.0), 3) # 

    x = 0
    y = 1
    z = 3 
    p0 = (x * TILES_SIZE, (y + 1) * TILES_SIZE)
    p1 = ((x + 1) * TILES_SIZE, y * TILES_SIZE)
    print (p0, p1)

    x = 1
    y = 0
    z = 3 
    p0 = (x * TILES_SIZE, y * TILES_SIZE)
    p1 = ((x + 1) * TILES_SIZE, (y + 1) * TILES_SIZE)
    print (p0, p1)
    print fromPixelToMetre((1024, 0), (2048, 1024), 3)
    print fromMetreToPixel((522400.0,247600.0,624800.0,350000.0), 3)
    """

    """
    x = 881
    y = 100
    z = 10
    p0 = (x * TILES_SIZE, (y + 1) * TILES_SIZE)
    p1 = ((x + 1) * TILES_SIZE, y * TILES_SIZE)
    print fromPixelToMetre(p0, p1, z)
    """

    bbox = (871000, 30000, 900000, 350000)
    render_tiles(bbox, mapfile, tile_dir, 10, 10, "Suisse")


