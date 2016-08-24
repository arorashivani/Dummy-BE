'use strict';
var logger = require('../utilities/logger.js');
var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var conf = require('../../config/initializers/loadConfig');
var configs = conf.configuration;

var user = require('../models/user');

router.use(function (req, res, next) {
  logger.info(req);

  // check header for token
  var token = req.headers['x-access-token']; // decode token
  if (token) {
    // verifies secret and checks exp
    //logger.debug('secret' + configs.jwt_secret);
    jwt.verify(token, configs.jwtSecret, function (err, decoded) {
      if (err) {
        logger.error(err);
        logger.debug(err);
        if (err.name === 'TokenExpiredError') {
          return res.status(401).send({
            'meta': {
              'error_type': 'TokenExpiredError',
              'status_code': 401,
              'error_message': 'Token is expired'
            },
            data: {}
          });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).send({
            'meta': {
              'error_type': 'JsonWebTokenError',
              'status_code': 401,
              'error_message': 'Token is invalid'
            },
            data: {}
          });
        }
      } else {
        user.count({'authToken.token': token}).then(function(userCount){
        if(userCount !== 0)
        {
             req.decoded = decoded;

               next();

        } else {
           return res.status(401).send({
             'meta': {
               'error_type': 'TokenExpiredError',
               'status_code': 401,
               'error_message': 'Token is invalid'
             },
             data: {}
           });
         }
       });

      }
    });
  } else {
//if there is no token do not continue
    logger.debug('Some error occurred... ');
    return res.status(401).send({
      'meta': {
        'error_type': 'Token Error',
        'status_code': 401,
        'error_message': 'Unauthorized Access'
      },
      data: {}
    });
    //next();
  }
});

module.exports = router;
