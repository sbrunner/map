<!--
Settings for your postgres setup.

Note: feel free to leave password, host, port, or use blank
-->

<Parameter name="type">postgis</Parameter>
<Parameter name="password">www-data</Parameter>
<Parameter name="host">localhost</Parameter>
<Parameter name="port">5433</Parameter>
<Parameter name="user">www-data</Parameter>
<Parameter name="dbname">osm-ch-071031</Parameter>
<!-- this should be 'false' if you are manually providing the 'extent' -->
<Parameter name="estimate_extent">false</Parameter>
<!-- manually provided extent in epsg 900913 for whole globe -->
<!-- providing this speeds up Mapnik database queries -->
<!--Parameter name="extent">572215, 5684416,1277663, 6145308</Parameter-->
<Parameter name="extent">656784, 5732403, 1168854, 6090234</Parameter>
