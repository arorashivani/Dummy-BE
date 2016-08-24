'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
var bodyParser = require('body-parser');

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var app = express();

//var config = require('./config/environments/dev')[env];

var nconf = require('./config/initializers/loadConfig');
var configs = nconf.configuration;

//require('./app/config/express')(app, config);
require('./config/initializers/database')(configs);
//require('./app/config/passport')();

require('./config/initializers/server')(app, configs);

// error handlers

// development error handler
// will print stacktrace
if (env === 'development') {
    console.log('dev env');
    app.use(function (err, req, res, next) {
        return res.status(err.status || 500).send('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    return res.status(err.status || 500).send('error', {
            message: err.message,
            error: {}
        }
    );
});


module.exports = app;
