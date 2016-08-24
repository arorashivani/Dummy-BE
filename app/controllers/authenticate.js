'use strict';
var logger = require('../utilities/logger.js');

var jwt = require('jsonwebtoken');
var encrypt = require('../utilities/encryption');
var users = require('../models/user');
var conf = require('../../config/initializers/loadConfig');
var config = conf.configuration;//get all the configuration options
var Promise = require('bluebird');



module.exports = {
  authenticate: function (req, res, next) {
    logger.info(req);
    //console.log('email:' +req.body.email);
    var userObj = {};
    //use promise to chain the method calls
    var promise = users.findOne({username: req.body.username}).exec();

    promise.then(function (user) {
        return encrypt.ValidatePwd(req.body.password, user);
      })
      .then(function (user) {

        //assign new token everytime user logs in
        var newToken = jwt.sign({user: user.username},
          config.jwtSecret,
          {
            expiresIn: config.tokenExpiresIn /*expires in 90 min*/
          });

        var expireDate = new Date();
        expireDate.setSeconds(expireDate.getSeconds() + config.tokenExpiresIn);

        //update user in database
        user.authToken.token = newToken;
        user.authToken.expiresAt = expireDate;
        return user;
      })
      .then(function(user) {

        userObj = user;
        userObj.save();

        return res.json({
          'meta': {
            'status_code': 200
          },
          data: {
            message: 'User Login is successful',
            authToken: userObj.authToken.token
          }
        });
      })
      .catch(function (err) {
        logger.error(err);
        //console.log(err.stack);
        return res.status(401).json({
          'meta': {
            'error_type': 'Unauthorized',
            'status_code': 401,
            'error_message': err.message
          },
          data: {}
        });
      });
  },

  logout: function (req, res, next) {
    logger.info(req);
    if (req.headers['x-access-token'] !== undefined) {
      //use promise to chain the method calls
      var promise = users.findOne({'authToken.token': req.headers['x-access-token']}).exec();

      promise.then(function (user) {
          //logger.debug('user:' + user.email);
          user.authToken.token = '';
          user.authToken.expiresAt = '';
          user.save();
          return res.json({
            'meta': {
              'status_code': 200
            },
            data: {
              message: 'User Logged out successfully'
            }
          });
        })
        .catch(function (err) {
          logger.error(err);
          return res.json({
            'meta': {
              'error_type': 'Logout Error',
              'status_code': 403,
              'error_message': err.message
            },
            data: {}
          });
        });
    }
    else {
      return res.json({
        'meta': {
          'error_type': 'Logout Error',
          'status_code': 403,
          'error_message': 'User cannot be logged out. Check logs for more info'
        },
        data: {}
      });
    }
  }
};
