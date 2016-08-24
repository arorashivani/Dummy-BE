'use strict';

var index = require('../../app/routes/index');
var users = require('../../app/routes/users');
var auth = require('../../app/routes/authenticate');
//var logger = require('morgan');
var bodyParser = require('body-parser');
var verifyToken = require('../../app/middlewares/verifyToken');

module.exports = function (app, configs) {

  //app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'x-access-token, Content-Type, if-modified-since, Pragma, Cache-Control');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH, GET, POST');
    if ('OPTIONS' === req.method) {
      res.sendStatus(204);
    }
    else {
      next();
    }

});
  app.use('/api', index);

  app.use('/api', auth);

  //TODO - forgot password route

 // app.use('/api/logout', verifyToken, auth);

  app.use('/api/users', verifyToken, users);
  app.use('/api/logout', verifyToken, auth);

// catch 404 and forward to error handler
  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });


};
