<?php
//          FILE: proxy.php
//
// LAST MODIFIED: 2006-03-23, 2010-10-24
//
//        AUTHOR: Troy Wolf <troy@troywolf.com>, Stéphane Brunner <courriel@stephane-brunner.ch>
//
//   DESCRIPTION: Allow scripts to request content they otherwise may not be
//                able to. For example, AJAX (XmlHttpRequest) requests from a
//                client script are only allowed to make requests to the same
//                host that the script is served from. This is to prevent
//                "cross-domain" scripting. With proxy.php, the javascript
//                client can pass the requested URL in and get back the
//                response from the external server.
//
//         USAGE: "url" required parameter. For example:
//                http://www.mydomain.com/proxy.php?url=http://www.yahoo.com
//

// proxy.php requires Troy's class_http. http://www.troywolf.com/articles
// Alter the path according to your environment.
require_once("class_http.php");

$proxy_url = isset($_GET['url'])?$_GET['url']:false;
if (!$proxy_url) {
    header("HTTP/1.0 400 Bad Request");
    echo "proxy.php failed because proxy_url parameter is missing";
    exit();
}

// Instantiate the http object used to make the web requests.
// More info about this object at www.troywolf.com/articles
if (!$h = new http()) {
    header("HTTP/1.0 501 Script Error");
    echo "proxy.php failed trying to initialize the http object";
    exit();
}

$h->url = str_replace(" ", "%20", $proxy_url);
$h->postvars = $_POST;
if (!$h->fetch($h->url)) {
    header("HTTP/1.0 501 Script Error");
    echo "proxy.php had an error attempting to query the url (1) " . $h->url;
    exit();
}

$ary_headers = split("\n", $h->header);

// detect redirect

if ($ary_headers[0] == "HTTP/1.1 302 Found") {
  foreach($ary_headers as $hdr) { 
    $hdrs = split(" ", $hdr);
    if ($hdrs[0] == "Location:") {
      $h->url = $hdrs[1];
      $h->postvars = $_POST;
      if (!$h->fetch($h->url)) {
          header("HTTP/1.0 501 Script Error");
          echo "proxy.php had an error attempting to query the url (2) " . $h->url;
          exit();
      }
    }
  }
}


// Forward the headers to the client.
$ary_headers = split("\n", $h->header);
foreach($ary_headers as $hdr) {
  $hdrs = split(" ", $hdr);
  if ($hdrs[0] == "Location:") {
    header("Location: http://map.stephane-brunner.ch/proxy.php?url=".$hdrs[1]);
  }
  else {
    header($hdr);
  }
}

// Send the response body to the client.
echo $h->body;
?>
