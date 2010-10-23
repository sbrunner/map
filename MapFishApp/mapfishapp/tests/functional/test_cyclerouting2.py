from mapfishapp.tests import *

class TestCyclerouting2Controller(TestController):
    def test_index(self):
        response = self.app.get(url(controller='cyclerouting2'))
        # Test response...
