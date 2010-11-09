"""
    A controller with upload/download methods.

    Javascript usage example code:

    var uploadButton = new Ext.ux.form.FileUploadField({
        buttonOnly: true,
        buttonText: "Load a file",
        name: 'file',
        listeners: {
            'fileselected': function(button, value) {
                uploadForm.getForm().submit({
                    url: 'upload/upload',
                    waitMsg: 'Loading ...',
                    success: function(panel, o) {
                        // do something with o.result.url
                    }
                });
            }
        }
    });

    var uploadForm = new Ext.form.FormPanel({
        items: kmlUploadButton,
        fileUpload: true
    });
"""

import logging
import uuid
import simplejson
import time
import shutil
import os

from pylons import request, response, config, url
from pylons.controllers.util import abort
from pylons.decorators import jsonify
from paste.fileapp import FileApp 

from map.lib.base import BaseController, render

log = logging.getLogger(__name__)

class UploadController(BaseController):
    TEMP_FILE_PURGE_SECONDS = 2*24*60*60

    @jsonify
    def upload(self):

        file = request.POST['file']
        _, ext = os.path.splitext(file.filename)
        name = uuid.uuid4().hex + ext

        path = config['app_conf']['uploads_dir']
        # create the directory if it doesn't exist
        if not os.path.exists(path):
            os.makedirs(path)
        permanent_file = open(os.path.join(path, name), 'wb')

        try:
            shutil.copyfileobj(file.file, permanent_file)
        finally:
            file.file.close()
            permanent_file.close()

        self._purge_old_files()

        # 'text/html' content-type is required for ie
        response.content_type = 'text/html'
        # restore charset that should be set to 'utf-8' by jsonify
        # cf. http://pylonshq.com/project/pylonshq/ticket/707
        response.charset = 'utf-8'

        return {'success': True,
                'url': url(controller='upload', action='download', file=name, qualified=True)}

    def download(self):
        file = request.params['file']
        filename = os.path.join(
            config['app_conf']['uploads_dir'],
            os.path.basename(file)
        )
        if not os.path.exists(filename):
            abort(404)

        response.headers['Content-Disposition'] = 'attachment; filename="%s"'%(
            str(file)
        )
        wsgi_app = FileApp(filename) 
        return wsgi_app(request.environ, self.start_response) 

    def _purge_old_files(self):
        """
        Delete temp files that are more than TEMP_FILE_PURGE_SECONDS seconds old
        """
        files=os.listdir(config['app_conf']['uploads_dir'])
        for file in files:
            filename = os.path.join(
                config['app_conf']['uploads_dir'],
                file
            )
            age = time.time() - os.stat(filename).st_mtime
            if age > self.TEMP_FILE_PURGE_SECONDS:
                log.info("deleting leftover file :" + filename + " (age=" + str(age) + "s)")
                os.unlink(filename)
