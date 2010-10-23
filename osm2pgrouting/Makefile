CC = g++

SRC = src/Export2DB.cpp src/math_functions.cpp src/Node.cpp src/OSMDocumentParserCallback.cpp src/Way.cpp src/OSMDocument.cpp src/Configuration.cpp src/ConfigurationParserCallback.cpp

DEPS = src/XMLParser.cpp

INC = -I./ -Isrc -I/usr/include/pgsql -I/usr/include/postgresql

MAIN = src/osm2pgrouting.cpp

all:
	$(CC) -O2 -c $(SRC) $(INC) -ggdb3
	$(CC) -O2 -c $(DEPS) $(INC) -ggdb3
	$(CC) -O2 -o osm2pgrouting $(MAIN) *.o $(INC) -lexpat -ggdb3 -lpq
	rm *.o
clean:
	rm osm2pgrouting

