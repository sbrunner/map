CREATE OR REPLACE FUNCTION replaceOverMax (
    value double precision, max double precision, replace double precision
) RETURNS double precision AS $$
BEGIN
    IF value > max THEN
        RETURN replace;
    ELSE
        RETURN value;
    END IF;
END;
$$ LANGUAGE plpgsql;


DROP TABLE edges;
CREATE TABLE edges (id int4, source int4, target int4, cost double precision, reverse_cost double precision, x1 double precision, y1 double precision, x2 double precision, y2 double precision);
INSERT INTO edges (id, source, target, cost, reverse_cost, x1, y1, x2, y2)  
SELECT gid AS id, source, target, (case when altitude_diff > 0 then exp(altitude_diff / length * 0.012) else exp(altitude_diff / length * 0.009) end * length * 200 * replaceOverMax((case cycleway
when 'lane' then 1.05
when 'track' then 1.1
else 1
end) * 
(case oneway when '-1' then 9999 else 1
end) 
 *
(case bicycle 
when 'yes' then 1
when 'designated' then 1
when 'official' then 1
when 'destination' then 50
when 'agricultural' then 9999 
when 'forestry' then 9999
when 'delivery' then 9999
when 'permissive' then 9999
when 'private' then 9999
when 'no' then 9999
else (case access
when 'yes' then 1
when 'designated' then 1
when 'official' then 1
when 'destination' then 50
when 'agricultural' then 9999
when 'forestry' then 9999
when 'delivery' then 9999
when 'permissive' then 9999
when 'private' then 9999
when 'no' then 9999
else 1
end)
end) *
(case highway
when 'motorway' then 9999
when 'trunk' then 9999
when 'primary' then 1.015
when 'secondary' then 1.01
when 'tertiary' then 1.005
when 'residential' then 1
when 'unclassified' then 1
when 'service' then 1.015
when 'pedestrian' then 1.01
when 'cycleway' then 0.9
when 'footway' then 2
when 'path' then 1.05
when 'steps' then 7
when 'track' then 
(case tracktype
when 'grade1' then 1.1
when 'grade2' then 1.2
when 'grade3' then 1.5
when 'grade4' then 1.9
when 'grade5' then 2.5
else 1.5
end)
when 'road' then 1
else 9999
end) *
(case "mtb:scale" 
when '0' then 1
when '1' then 1.5
when '2' then 2
when '3' then 3
when '4' then 4.3
when '5' then 6
else (case sac_scale
when 'hiking' then 1.2
when 'mountain_hiking' then 3
when 'demanding_mountain_hiking' then 6
when 'alpine_hiking' then 12
when 'demanding_alpine_hiking' then 24
when 'difficult_alpine_hiking' then 48
else 1.2
end)
end) *
(case trail_visibility 
when 'excellent' then 1
when 'good' then 1.1
when 'intermediate' then 1.3
when 'bad' then 1.8
when 'horrible' then 2.5
when 'no' then 4
else 1.1
end)
, 100, -1) +
(case source_highway
when 'mini_roundabout' then 1
when 'stop' then 1
when 'give_way' then 1
when 'traffic_signals' then 7
when 'crossing' then 1
else 0
end) +
(case target_highway
when 'mini_roundabout' then 1
when 'stop' then 1
when 'give_way' then 1
when 'traffic_signals' then 7
when 'crossing' then 1
else 0
end)
)::float8 AS cost, (case when altitude_diff < 0 then exp(-altitude_diff / length * 0.012) else exp(-altitude_diff / length * 0.009) end * length * 200 * replaceOverMax((case cycleway
when 'lane' then 1.05 * (case oneway 
when 'yes' then 9999
when '1' then 9999
when 'true' then 9999 
else 1
end)
when 'track' then 1.1 * (case oneway 
when 'yes' then 9999
when '1' then 9999
when 'true' then 9999 
else 1
end)
when 'opposite_lane' then 1.05
when 'opposite_track' then 1.1
when 'opposite' then 1.1
else (case oneway 
when 'yes' then 9999
when '1' then 9999
when 'true' then 9999 
else 1
end)
end) 
 *
(case bicycle 
when 'yes' then 1
when 'designated' then 1
when 'official' then 1
when 'destination' then 50
when 'agricultural' then 9999 
when 'forestry' then 9999
when 'delivery' then 9999
when 'permissive' then 9999
when 'private' then 9999
when 'no' then 9999
else (case access
when 'yes' then 1
when 'designated' then 1
when 'official' then 1
when 'destination' then 50
when 'agricultural' then 9999
when 'forestry' then 9999
when 'delivery' then 9999
when 'permissive' then 9999
when 'private' then 9999
when 'no' then 9999
else 1
end)
end) *
(case highway
when 'motorway' then 9999
when 'trunk' then 9999
when 'primary' then 1.015
when 'secondary' then 1.01
when 'tertiary' then 1.005
when 'residential' then 1
when 'unclassified' then 1
when 'service' then 1.015
when 'pedestrian' then 1.01
when 'cycleway' then 0.9
when 'footway' then 2
when 'path' then 1.05
when 'steps' then 7
when 'track' then 
(case tracktype
when 'grade1' then 1.1
when 'grade2' then 1.2
when 'grade3' then 1.5
when 'grade4' then 1.9
when 'grade5' then 2.5
else 1.5
end)
when 'road' then 1
else 9999
end) *
(case "mtb:scale" 
when '0' then 1
when '1' then 1.5
when '2' then 2
when '3' then 3
when '4' then 4.3
when '5' then 6
else (case sac_scale
when 'hiking' then 1.2
when 'mountain_hiking' then 3
when 'demanding_mountain_hiking' then 6
when 'alpine_hiking' then 12
when 'demanding_alpine_hiking' then 24
when 'difficult_alpine_hiking' then 48
else 1.2
end)
end) *
(case trail_visibility 
when 'excellent' then 1
when 'good' then 1.1
when 'intermediate' then 1.3
when 'bad' then 1.8
when 'horrible' then 2.5
when 'no' then 4
else 1.1
end)
, 100, -1) +
(case source_highway
when 'mini_roundabout' then 1
when 'stop' then 1
when 'give_way' then 1
when 'traffic_signals' then 7
when 'crossing' then 1
else 0
end) +
(case target_highway
when 'mini_roundabout' then 1
when 'stop' then 1
when 'give_way' then 1
when 'traffic_signals' then 7
when 'crossing' then 1
else 0
end)
)::float8 AS reverse_cost, x1, y1, x2, y2 FROM ways;

CREATE INDEX gid ON ways(source);
CREATE INDEX id ON edges(source);
CREATE INDEX source_idx ON edges(source);
CREATE INDEX target_idx ON edges(target);
CREATE INDEX geom_idx ON edges USING GIST(the_geom GIST_GEOMETRY_OPS);

GRANT SELECT ON ways TO pgrouting;
GRANT SELECT ON edges TO pgrouting;

VACUUM FULL ANALYZE;
