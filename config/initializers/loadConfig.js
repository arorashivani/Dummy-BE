'use strict';
var nconf = require('nconf');
var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');

function readConfigFile() {
    nconf.env()
        .file('configs', {
            file: process.env.NODE_ENV + '.json',
            dir: rootPath + 'config/environments',
            search: true
        });
    var configs = {};

    configs.env = process.env.NODE_ENV;
    configs.host = nconf.get('host');
    configs.port = nconf.get('port');
    configs.dbUrl = nconf.get('dbUrl');
    configs.dbPort = nconf.get('dbPort');
    configs.jwtSecret = nconf.get('jwtSecret');
    configs.tokenExpiresIn = nconf.get('tokenExpiresIn');
    configs.templates = nconf.get('templates');
    
    configs.protocol = nconf.get('protocol');
    configs.frontendUrl = nconf.get('frontendUrl');
    configs.maxFileSize = nconf.get('maxFileSize');
    configs.resumeUploadPath = path.normalize(__dirname + '/../../' + nconf.get('resumeUploadPath'));
    configs.unsubscribeUrl = nconf.get('unsubscribeUrl');
    return configs;
}

module.exports = {configuration: readConfigFile()};
