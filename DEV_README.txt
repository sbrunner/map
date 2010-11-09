Installation
============

Install the buildout environment:

  python bootstrap.py --distribute --version 1.5.2

Install the project:

  buildout/bin/buildout

If you have a custom buildout config file, you should instead run:

  buildout/bin/buildout -c buildout_myconfig.cfg

Now look at apache/README.txt and go configure your Apache virtual host.

Internationalization
====================

Getting Started
---------------

1) Uncomment the 'message_extractors' option in setup.py.

2) Extract all messages from the project:

  buildout/bin/python setup.py extract_messages

3) Initialize a catalog for every supported language, for example:

  buildout/bin/python setup.py init_catalog -l fr
  buildout/bin/python setup.py init_catalog -l en

4) Edit the .po files in map/i18n/*/LC_MESSAGES/map.po

5) Run buildout to compile all the .po files to .mo:

  buildout/bin/buildout -c buildout_myconfig.cfg

6) Finally dont't forget to restart apache:

  sudo apache2ctl graceful

When you add a new messagge repeat steps 2, 4 to translate, 5 and 6 to export.

Source: http://wiki.pylonshq.com/display/pylonsdocs/Internationalization+and+Localization

