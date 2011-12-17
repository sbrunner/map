#!/usr/bin/env python

# This source code is considered Public Domain.

# requires oauth2, to install:
# git clone http://github.com/simplegeo/python-oauth2.git
# cd python-oauth2/ && make
# python setup.py install

# reads from the following files (must exist, even if just empty!):
# - way_nodes.csv
# - relation_members_node.csv
# - relation_members_way.csv
# - relation_members_relation.csv
#
# each file contains the way/relation id (first column)
# and non-existing to_node/way/relation (second column)
# separator is a comma ','


import urllib
import oauth2 as oauth
import cgi
from cgi import FieldStorage

class OSMOAuth:
    '''OAuth client for OpenStreetMap.
    If you are writing your own application, please use your own CONSUMER_KEY and SHARED_SECRET.
    Register at $API_URL/oauth_clients'''

    # devserver, use for testing
#    API_URL = "http://api06.dev.openstreetmap.org"
    API_URL = "http://www.openstreetmap.org"
    CONSUMER_KEY = "6a9xZHmgvVL2w6jLBMhKzZvB1AV5POxQP862YmYu"
    SHARED_SECRET = "eH0KK9qDI92XmJn0xuvZOVySsUUF1Z45uEQUuvMH"

    def __init__(self, session):
        self.consumer = oauth.Consumer(key = OSMOAuth.CONSUMER_KEY, secret = OSMOAuth.SHARED_SECRET)
        self.client = oauth.Client(self.consumer)
        data = session.data
        self.data = data
        args = FieldStorage()
        if args.list != None and args.has_key('reset'):
            data['oauth_token'] = None
            data['oauth_token_secret'] = None
            
        if data.get('oauth_token') != None:
            self.is_authorized = data['oauth_authorized'] == '1'
        else:
            self.request_token()
            
        if not self.is_authorized:
            token = self.request_access_token()
            if not 'oauth_token' in token:
                self.request_token()
            else:
                data['oauth_token'] = token['oauth_token']
                data['oauth_token_secret'] = token['oauth_token_secret']
                data['oauth_authorized'] = '1'
                print session.cookie

        self.access_with()

    def request_token(self):
        # otherwise create a new token and store it in datauration file
        self.token = self.get_request_token()
        self.is_authorized = False
        self.data['oauth_token'] = self.token['oauth_token']
        self.data['oauth_token_secret'] = self.token['oauth_token_secret']
        self.data['oauth_authorized'] = '0'
        print session.cookie
        print "Status: 302 Moved"
        print "Location: %s" % (OSMOAuth.API_URL+'/oauth/authorize?oauth_token='+self.token['oauth_token'])
        print

    def request_token_url(self):
        return self.API_URL + "/oauth/request_token"

    def access_token_url(self):
        return self.API_URL + "/oauth/access_token"

    def get_request_token(self, callback=None):
        params = {}
        if callback:
            params["oauth_callback"] = callback
        resp, content = self.client.request(self.request_token_url(), "POST", body=urllib.urlencode(params))
        return dict(cgi.parse_qsl(content))
        
    def request_access_token(self):
        token = oauth.Token(self.data['oauth_token'], self.data['oauth_token_secret'])
        
        self.client = oauth.Client(self.consumer, token)
        resp, content = self.client.request(self.access_token_url(), "POST")
        return dict(cgi.parse_qsl(content))
        
    def access_with(self):
        access_token = oauth.Token(self.data['oauth_token'], self.data['oauth_token_secret'])
        self.client = oauth.Client(self.consumer, access_token)

    def post(self, path, data=None):
        resp, content = self.client.request(OSMOAuth.API_URL + path, "POST", data)
        return content
        
    def get(self, path):
        resp, content = self.client.request(OSMOAuth.API_URL + path)
        return content
        
    def put(self, path, data=None):
        resp, content = self.client.request(OSMOAuth.API_URL + path, "PUT", data)
        return content

    def delete(self, path, data=None):
        resp, content = self.client.request(OSMOAuth.API_URL + path, "DELETE", data)
        return content
