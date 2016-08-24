var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');

module.exports = {
    development: {
        db: 'mongodb://localhost/hcldb',
        rootPath: rootPath,
        port: process.env.PORT || 3030
    },
    production: {
        db: '',
        rootPath: rootPath,
        port: process.env.PORT || 80
    }
};
