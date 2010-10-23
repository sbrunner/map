from mapfishapp.tests import *

class TestCycleroutingController(TestController):
    def test_index(self):
        response = self.app.get(url(controller='cyclerouting'))
        # Test response...
