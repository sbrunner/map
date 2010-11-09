try:
    from setuptools import setup, find_packages
except ImportError:
    from ez_setup import use_setuptools
    use_setuptools()
    from setuptools import setup, find_packages

setup(
    name='map',
    version='0.1',
    description='',
    author='',
    author_email='',
    url='',
    install_requires=[
        "psycopg2>=2.2.0,<=2.2.99",
        "mapfish>=2.0,<=2.0.99",
        "httplib2>=0.6.0,<=0.6.99",
        "Babel<=0.9.99",
        "TileCache>=2.10,<=2.10.99"
    ],
    #setup_requires=["PasteScript>=1.6.3"],
    packages=find_packages(exclude=['ez_setup']),
    include_package_data=True,
    test_suite='nose.collector',
    package_data={'map': ['i18n/*/LC_MESSAGES/*.mo']},
    #message_extractors={'map': [
    #        ('**.py', 'python', None),
    #        ('templates/**', 'mako', {'input_encoding': 'utf-8'}),
    #        ('public/**', 'ignore', None)]},
    zip_safe=False,
    #paster_plugins=['MapFish', 'PasteScript', 'Pylons', 'map'],
    entry_points="""
    [paste.app_factory]
    main = map.config.middleware:make_app

    [paste.app_install]
    main = pylons.util:PylonsInstaller
    """,
)
