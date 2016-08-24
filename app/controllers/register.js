'use strict';
var logger = require('../utilities/logger.js');

var users = require('../models/user');
var jwt = require('jsonwebtoken');
var encrypt = require('../utilities/encryption');
var conf = require('../../config/initializers/loadConfig');
var Promise = require('bluebird');
var mailer = require('../utilities/mandrill');
var userCntrl = require('../controllers/users');
var utility = require('../utilities/common');
var logForAuditCtrl = require('../controllers/logForAudit');

var config = conf.configuration;//get all the configuration options
var frontendUrl = config.frontendUrl;

module.exports.registerUser = function (req, res, next) {
  logger.info(req);
  var arrPromise = [];
  arrPromise[0] = users.findOne({email: req.body.email})
  .populate({
      path: 'permissionGroupIDs',
      model: 'permissionGroup',
      populate: {
        path: 'permIDs',
        model: 'Permission',
        select:'_id'
      }
    }).exec();

  arrPromise[1] = utility.getAllPermissionFromDb();

  Promise.all(arrPromise).then(function () {

      var user = arrPromise[0].value();
      var perms = arrPromise[1].value();

      if (user) {
        var rToken = user.rToken;
        if (user.isRegistered) {

          return res.status(400).json({
            'meta': {
              'error_type':'Bad Request',
              'status_code': 400,
              'error_message': 'User is already registered in the system'
            },
            data: {}
          });
        }
        else if (req.query.rToken === rToken.token && rToken.type === 'register' && !user.isRegistered) {

          var userSnapshotForAuditBeforeRegister =
            logForAuditCtrl.filterDocumentJSONForAuditAction(user.toJSON(), 'Registration');

          user.securityQuestion = req.body.securityQuestion;
          user.securityAnswer = req.body.securityAnswer;

          var expireDate = new Date();
          expireDate.setSeconds(expireDate.getSeconds() + config.tokenExpiresIn);

          var permGrpIds = user.permissionGroupIDs;
          var featureAccess = utility.getUserPermissions(perms, permGrpIds);

          user.authToken.expiresAt = expireDate;
          user.authToken.token = jwt.sign(
            {user: user.email, featureAccess: featureAccess},
            config.jwtSecret,
            {expiresIn: config.tokenExpiresIn}/*expires in 90 min*/
          );
          var salt = encrypt.CreateSalt();
          user.salt = salt;
          user.isRegistered = true;

          return encrypt.HashPwd(salt, req.body.password)
            .then(function (val) {
              user.password = val;
              user.rToken.token = '';
              user.rToken.type = '';
              //update to database
              users.update({'email': user.email}, user,{runValidators:true}).exec();

              return user;

            })
            .then(function (newUser) {

              var auditLogData = {
                auditType: 'user',
                action: 'Registration',
                actionOnID: user.userID,
                actionOnName: user.firstName + ' ' + user.lastName,
                actionBy: newUser._id,
                actionType: 'update'
              };
              auditLogData.dataSnapshotJson = {
                newValues: logForAuditCtrl
                  .filterDocumentJSONForAuditAction(newUser.toJSON(), 'Registration'),
                oldValues: userSnapshotForAuditBeforeRegister
              };

              return logForAuditCtrl.log(req, auditLogData)
                .then(function () {
                  return res.json({
                    'meta': {
                      'status_code': 200
                    },
                    data: {
                      message: 'User Registration is successful',
                      authToken: user.authToken.token
                    }
                  });
                });

            });
        }//end if
        else {
          return Promise.reject(new Error('Token is invalid!'));
        }
      }
      else {
        return Promise.reject(new Error('User not found in the system!'));
      }
    })
    .catch(function (err) {
      logger.error(err);
      return res.status(403).json({
        'meta': {
          'error_type': 'Registration error',
          'status_code': 403,
          'error_message': err.message
        },
        data: {}
      });
    });
};

module.exports.getSecQuestion = function (req, res, next) {
  logger.info(req);
  users.findOne({email: req.body.email}, 'securityQuestion isActive',
    function (err, userDetail) {
      if (err) {
        logger.error(err);
        return res.json({
          'meta': {
            'error_type': 'Password recovery',
            'status_code': 500,
            'error_message': 'Error occurred: ' + err
          },
          data: {}
        });
      } else if (!userDetail) {
        return res.json({
          'meta': {
            'error_type': 'Password recovery',
            'status_code': 404,
            'error_message': 'This email is not in our records'
          },
          'data': {}
        });
      }
      else if (userDetail.isActive) {
        return res.json({
          'meta': {
            'status_code': 200
          },
          data: userDetail.securityQuestion
        });
      }
      else {
        return res.json({
          'meta': {
            'error_type': 'Password recovery',
            'status_code': 403,
            'error_message': 'User is not acitve'
          },
          'data': {}
        });
      }
    });
};

module.exports.getSecAnswer = function (req, res, next) {
  logger.info(req);
  users.findOne({email: req.body.email}, 'securityQuestion isActive securityAnswer',
    function (err, userDetail) {
      if (err) {
        logger.error(err);
        return res.json({
          'meta': {
            'error_type': 'Internal server error',
            'status_code': 500,
            'error_message': 'Password recovery'
          },
          data: 'Error occurred: ' + err
        });
      }
      else if (!userDetail) {
        return res.json({
          'meta': {
            'error_type': 'Password recovery Failed',
            'status_code': 404,
            'error_message': 'This email is not in our records'
          },
          'data': {}
        });
      }
      else if (userDetail.isActive) {
        if (userDetail.securityQuestion === req.body.securityQuestion &&
          userDetail.securityAnswer === req.body.securityAnswer) {
          forgotPassword(req, res, next);
        }
        else {
          return res.json({
            'meta': {
              'error_type': 'Password recovery',
              'status_code': 403,
              'error_message': 'Incorrect answer to security question'
            },
            'data': {}
          });
        }
      }
      else {
        return res.json({
          'meta': {
            'error_type': 'Password recovery',
            'status_code': 403,
            'error_message': 'User is not acitve'
          },
          'data': {}
        });
      }
    });
};

module.exports.getRegistrationData = function (req, res, next) {
  logger.info(req);
  var details = 'email isActive firstName lastName';
  var rquestedToken = req.params.rToken;
  var tokenType = 'register';
  var params = {'rToken.token': rquestedToken, 'rToken.type': tokenType};
  var callback = function (result) {
    res.json(result);
  };
  userCntrl.getRegistrationData(params, details, callback);
};

module.exports.changeSecurityAns = function (req, res, next) {
  logger.info(req);
  var updatedSecurityQuestion = req.body.securityQuestion;
  var updatedRToken = encrypt.GenerateRandomVal();
  var updatedSecurityAnswer = req.body.securityAnswer;
  var minLengthSecAnswer = 5;
  var maxLengthSecAnswer = 20;
  if (updatedSecurityAnswer.length < minLengthSecAnswer) {
    res.json({
      meta: {
        'status_code': 400,
        'error_message': 'SecurityAnswer must be at least 5 characters long',
        'error_type': 'Server error'
      },
      data: {}
    });
  } else if (updatedSecurityAnswer.length > maxLengthSecAnswer) {
    res.json(
      {
        meta: {
          'status_code': 400,
          'error_type': '',
          'error_message': 'SecurityAnswer must be less than 20 characters long'
        },
        data: {}
      }
    );
  }
  else {
    users.findOneAndUpdate({'rToken.token': req.body.token, 'rToken.type': 'resetPassword'}, {
      $set: {
        securityAnswer: updatedSecurityAnswer, securityQuestion: updatedSecurityQuestion,
        'rToken.token': updatedRToken
      }
    }, {safe: true, new: false}, function (err, userData) {
      if (err) {
        logger.error(err);
        res.json({
          meta: {
            'status_code': 500,
            'error_message': 'server error',
            'error_type': 'server error'
          },
          data: {}
        });
      }
      else if (!userData) {
        return res.json({
          'meta': {
            'error_type': 'Password recovery Failed',
            'status_code': 404,
            'error_message': 'Your token has expired'
          },
          'data': {}
        });
      }
      else {
        var auditLogData = {
          auditType: 'user',
          action: 'ChangeSecurityQuestion',
          actionOnID: userData.userID,
          actionOnName: userData.firstName + ' ' + userData.lastName,
          actionBy: userData._id,
          actionType: 'update'
        };
        var newUserData = {
          securityAnswer: updatedSecurityAnswer,
          securityQuestion: updatedSecurityQuestion
        };
        var oldUserData = {
          securityAnswer: userData.securityAnswer,
          securityQuestion: userData.securityQuestion
        };


        auditLogData.dataSnapshotJson = {
          newValues: logForAuditCtrl.filterDocumentJSONForAuditAction(newUserData, 'ChangeSecurityQuestion'),
          oldValues: logForAuditCtrl.filterDocumentJSONForAuditAction(oldUserData, 'ChangeSecurityQuestion')
        };

        logForAuditCtrl.log(req, auditLogData)
          .then(function () {
            req.body.email = userData.email;
            updatePassword(req, res, next);
            return null;
          })
          .catch(function (err) {
            logger.error(err);
            res.json({
              meta: {'status_code': 200}, data: []
            });
          });
      }
    });
  }
};

module.exports.forgotSecAns = function (req, res, next) {
  logger.info(req);
  var uEmail = req.body.email;
  if (uEmail) {
    users.find({email: uEmail}, function (err, user) {
      if (err) {
        logger.error(err);
        return res.json({
          'meta': {
            'error_type': 'Password recovery Failed',
            'status_code': 404,
            'error_message': 'This email is not in our records'
          },
          'data': []
        });
      } else {
        var updatedRToken = encrypt.GenerateRandomVal();
        users.findOne({email: uEmail}, function (err, user) {
          if (err) {
            logger.error(err);
            res.json({
              meta: {
                'status_code': 500,
                'error_message': 'server error',
                'error_type': 'server error'
              },
              data: {}
            });
          } else {
            var currentToken = user.rToken.token;
            user.rToken.token = updatedRToken;
            user.rToken.type = 'resetPassword';
            if (user.resendHistory) {
              user.resendHistory.rToken = {'token': currentToken};
            } else {
              user.resendHistory = {'rToken.token': currentToken};
            }
            user.save(function (err, user) {
              if (err) {
                logger.error(err);
                return next(err);
              } else {
                //mailing code here
                var registerLink = frontendUrl + '/' +
                  'updateSecurityAns/?rToken=' + updatedRToken;
                var message = {
                  'to': user.email,
                  'toName': user.firstName,
                  'link': registerLink,
                  'alink': registerLink
                };
                mailer(message, 'forgotSecurity', function (err) {
                  if (err) {
                    logger.error(err);
                    logger.debug('error in sending mail.....');
                    res.json({
                      meta: {
                        'status_code': 500,
                        'error_message': err.message,
                        'error_type': err.name
                      },
                      data: {}
                    });
                  } else {
                    logger.debug('mail sent successful.....');
                    var auditLogData = {
                      auditType: 'user',
                      action: 'ForgotSecurityAnswer',
                      actionOnID: user.userID,
                      actionOnName: user.firstName + ' ' + user.lastName,
                      actionBy: user._id
                    };

                    logForAuditCtrl.log(req, auditLogData)
                      .then(function (val) {
                        res.json({
                          meta: {
                            'status_code': 200
                          },
                          data: {}
                        });
                      });
                  }
                });
              }
            });
          }
        });
      }
    });
  } else {
    return res.json({
      'meta': {
        'error_type': 'Password recovery Failed',
        'status_code': 404,
        'error_message': 'Please enter a valid email'
      },
      'data': []
    });
  }
};

module.exports.checkPassword = function (req, res, next) {
  logger.info(req);
  var userDetail = {};
  userCntrl.getCurrentUser(req, res, next)
    .then(function (user) {
      userDetail = user;
      return encrypt.ValidatePwd(req.body.currentPassword, user);
    })
    .then(function (result) {
      updatePassword(req, res, next);
    })
    .catch(function (err) {
      logger.error(err);
      res.json({meta: {'status_code': 400}, data: false});
    });
};

module.exports.checkUser = function (req, res, next) {
  logger.info(req);
  var details = 'email';
  var rquestedToken = req.query.rToken;
  var tokenType = 'register';
  var params = {'rToken.token': rquestedToken, 'rToken.type': 'resetPassword'};
  users.findOne(params, function (err, userData) {
    if (err) {
      logger.error(err);
      return res.json({
        'meta': {
          'status_code': 500, 'error_type': 'Server error',
          'error_message': 'Unable to proceed at the moment, please try later'
        },
        data: {}
      });
    } else if (userData === null) {
      return res.json({
        'meta': {
          'error_type': 'Password recovery Failed',
          'status_code': 404,
          'error_message': 'Your token has expired'
        }, data: {}
      });
    } else {
      req.body.email = userData.email;
      updatePassword(req, res, next);
    }
  });
};

var forgotPassword = function (req, res, next) {
  logger.info(req);
  var uEmail = req.body.email;
  if (uEmail) {
    users.find({email: uEmail}, function (err, user) {
      if (err) {
        logger.error(err);
        return res.json({
          'meta': {
            'error_type': 'Password recovery Failed',
            'status_code': 404,
            'error_message': 'This email is not in our records'
          },
          'data': []
        });
      } else {
        var updatedRToken = encrypt.GenerateRandomVal();
        users.findOne({email: uEmail}, function (err, user) {
          if (err) {
            logger.error(err);
            res.json({
              meta: {
                'status_code': 500,
                'error_message': 'server error',
                'error_type': 'server error'
              },
              data: {}
            });
          } else {
            var currentToken = user.rToken.token;
            user.rToken.token = updatedRToken;
            user.rToken.type = 'resetPassword';
            if (user.resendHistory) {
              user.resendHistory.rToken = {'token': currentToken};
            } else {
              user.resendHistory = {'rToken.token': currentToken};
            }
            user.save(function (err, user) {
              if (err) {
                logger.error(err);
                return next(err);
              } else {
                //mailing code here
                var registerLink = frontendUrl + '/' +
                  'resetPassword/?rToken=' + updatedRToken;
                var message = {
                  'to': user.email,
                  'toName': user.firstName,
                  'link': registerLink,
                  'alink': registerLink
                };
                mailer(message, 'forgotPassword', function (err) {
                  if (err) {
                    logger.error(err);
                    logger.debug('error in sending mail.....');
                    res.json({
                      meta: {
                        'status_code': 500,
                        'error_message': err.message,
                        'error_type': err.name
                      },
                      data: {}
                    });
                  } else {
                    logger.debug('mail sent successful.....');
                    var auditLogData = {
                      auditType: 'user',
                      //action: 'ForgotSecurityAnswer',
                      action: 'forgotPassword',
                      actionOnID: user.userID,
                      actionOnName: user.firstName + ' ' + user.lastName,
                      actionBy: user._id
                    };
                    res.json({
                      meta: {
                        'status_code': 200
                      },
                      data: {}
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  } else {
    return res.json({
      'meta': {
        'error_type': 'Password recovery Failed',
        'status_code': 404,
        'error_message': 'Please enter a valid email'
      },
      'data': []
    });
  }
};

var updatePassword = function (req, res, next) {
  logger.info(req);
  var userData = req.body;
  var password = userData.password;
  var email = userData.email;
  var minLenPassword = 8;
  var maxLenPassword = 15;
  var modifyCurrentPassword = false;
  if (typeof userData.modify !== 'undefined' && userData.modify) {
    modifyCurrentPassword = userData.modify;
  }
  var callback;
  if (password.length < minLenPassword) {
    res.status(400);
    res.json({
      meta: {'status_code': 400},
      data: {'errMsg': 'Password must be at least 8 characters long'}
    });
  } else if (password.length > maxLenPassword) {
    res.status(400);
    res.json({
      meta: {'status_code': 400},
      data: {'errMsg': 'Password must be less than 15 characters long'}
    });
  } else if (password.search(/\d/) === -1) {
    res.status(400);
    res.json({
      meta: {'status_code': 400},
      data: {'errMsg': 'Password must contain at least 1 number'}
    });
  } else if (password.search(/[a-zA-Z]/) === -1) {
    res.status(400);
    res.json({
      meta: {'status_code': 400},
      data: {'errMsg': 'Password must contain at least 1 letter'}
    });
  }
  else {
    var updatedSalt = encrypt.CreateSalt();
    var updatedRToken = encrypt.GenerateRandomVal();

    var updatedPassword;
    callback = function (response) {
      var user = response.data;
      if (user.userID) {

        var auditLogData = {
          auditType: 'user',
          action: 'UpdatePassword',
          actionOnID: user.userID,
          actionOnName: user.firstName + '' + user.lastName,
          actionBy: user._id
        };
        logForAuditCtrl.log(req, auditLogData);

      }
    //  response.data.pull(salt);
    //  console.log(response);
  //    res.json(response);
    res.json({
      meta: {'status_code': 200},
      data: {userID:response.data.userID}
    });
    };
    encrypt.HashPwd(updatedSalt, password)
      .then(function (val) {
        var dataToUpdate = {};
        if (modifyCurrentPassword) {
          dataToUpdate = {salt: updatedSalt, password: val};
          userCntrl.updatePassword(email, dataToUpdate, callback);
        }
        else {
          dataToUpdate = {salt: updatedSalt, password: val, 'rToken.token': updatedRToken};
          userCntrl.updatePassword(email, dataToUpdate, callback);
        }
      });
  }
};

module.exports.updatePassword = updatePassword;
