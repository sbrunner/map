<!--
Settings for your postgres setup.

Note: feel free to leave password, host, port, or use blank
-->

<Parameter name="type">postgis</Parameter>
<Parameter name="dbname">osmch</Parameter>

<Parameter name="password"></Parameter>
<Parameter name="host">localhost</Parameter>
<Parameter name="port">5432</Parameter>
<Parameter name="user">postgres</Parameter>
<!-- this should be 'false' if you are manually providing the 'extent' -->
<Parameter name="estimate_extent">false</Parameter>
<!-- providing this speeds up Mapnik database queries -->
<!--Parameter name="extent">5.9700, 45.8300, 10.4900, 47.8100</Parameter-->
<!--Parameter name="extent">485869.5728, 76443.1884, 837076.5648, 299941.7864</Parameter-->
<Parameter name="extent">420000, 30000, 900000, 350000</Parameter>
