'use strict';
var logger=require('../utilities/logger.js');

var User = require('../models/user');


//var FS = require('fs');
var Promise = require('bluebird');
var encrypt = require('./../utilities/encryption');
var mailer = require('../utilities/mandrill');


exports.getUsers = function (req, res, next) {
  logger.info(req);
         User.find({},{
          password:0,salt:0})
            .exec(function (err, users) {
          if (err) {
            logger.error(err);
            // res.json(500, {error: 1, msg: 'some error'});
            res.status(500);
            return res.send(
              {
                meta:
                {
                  'error_type': 'Exception',
                  'status_code': 500,
                  'error_message': err.toString()
                },
                data: {}
              }
            );
          } else {
            //res.json(users);
            if (users.length === 0) {
              res.status(404);
              return res.send({
                meta: {
                  'error_type': 'Exception',
                  'status_code': 404,
                  'error_message': new Error('Record not found').toString()
                },
                data: {}
              });
            }
            res.json([{meta: {'status_code': 200}}, {data: users}]);
          }
        });
    };
var getUser = function (req, res, next) {
   logger.info(req);
	 if(typeof req.params.userName === 'undefined' && req.params.userName){
        res.status(400);
        return res.send({meta: {'error_type': 'Exception',
          'status_code': 400, 'error_message': new Error('Not sufficient parameter')},
          data: {}
        });
      }
      User.findOne(req.params.userName,function(err,result){
        if(err){
          logger.error(err);
          res.status(400);
          return res.send({meta: {'error_type': 'Exception',
          'status_code': 400, 'error_message': err.toString()},
            data: {}
          });
        }
        else {
          res.json([{meta: {'status_code': 200}}, {data: result}]);
        }
      });
  };
exports.getUser = getUser;

module.exports.updateUser = function(req,res,next){
  var salt = encrypt.CreateSalt();
return encrypt.HashPwd(salt, req.body.password)
    .then(function (val) {
    User.findOneAndUpdate({username:req.params.userName},{$set:{'salt':salt,'password':val}},
        {safe: true, new : true},function(err,userData){
            if(err){
			logger.error(err);
              var  result = {
                    meta: {'status_code': 500, 'error_type': 'Server error',
                            'error_message':'Error in finding user data'},
                    data: {}
                };
              return  res.json(result);
            } else if (userData === null) {
                result = {
                    meta:{
                        'error_type': 'Password recovery Failed',
                        'status_code': 404,
                        'error_message': 'This email is not in our records'
                    },data: {}
                };
                return  res.json(result);
            } else {
                result = {meta:{'status_code':200}, data:userData};
                return  res.json(result);
            }

        }
    );});
};

module.exports.createUser = function(req,res,next){
  var data = {};
  data.username = req.body.username;
  data.password = req.body.password;
  data.role = req.body.role;
  data.location = req.body.location;
  data.fName = req.body.fName;
  data.salt = encrypt.CreateSalt();
  encrypt.HashPwd(data.salt, data.password)
      .then(function (val) {data.password = val;
        var user = new User(data);
      user.save(function(err,result){if(err){console.log(err);}
      else{res.json([{meta: {'status_code': 200}}, {data: 'User Crested succesfully.'}]);}});
    });
};
