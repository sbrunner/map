# -*- coding: utf-8 -*-

import os

from setuptools import setup, find_packages

setup(
    name='osm_ch',
    version='1.0',
    description='OSM ch rendering project',
    author='Stéphane Brunner',
    author_email='stephane.brunner@camptocamp.com',
    url='http://stephane-brunner.ch',
    install_requires=[
        'zc.recipe.egg < 2.0.0',
        'WebError',
        'pyramid',
        'tilecloud-chain',
    ],
    packages=find_packages(exclude=['ez_setup']),
    include_package_data=True,
    zip_safe=False,
    entry_points={
        'paste.app_factory': [
            'main = osm_ch:main',
        ],
    },
)
