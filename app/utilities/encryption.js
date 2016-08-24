'use strict';
var logger=require('../utilities/logger.js');
var crypto = require('crypto');
var Promise = require('bluebird');

module.exports = {
  CreateSalt: function CreateSalt() {
    return crypto.randomBytes(128).toString('hex');
  },

  HashPwd: function HashPwd(salt, pwd) {
    return new Promise(function (resolve, reject) {
      crypto.pbkdf2(pwd, salt, 100000, 128, 'sha512', function (err, hash) {
        //var hashedPwd = new Buffer(hash);
        if (err) {
          logger.error(err);
          return reject(err);
        } else {
          resolve(hash.toString('hex'));
        }
      });
    });
  },
  ValidatePwd: function ValidatePwd(pwd, user) {
    var p = this.HashPwd(user.salt, pwd);
    return p.then(function (val) {
      if (user.password === val) {
        //logger.debug('password verified');
        return (user);
      }
      else {
        return Promise.reject(new Error('Password verification failed'));
      }
    });
  },
  GenerateRandomVal: function GenerateRandomVal() {
    //length is 15 characters long
    return crypto.randomBytes(Math.ceil(15 / 2))
      .toString('hex') // convert to hexadecimal format
      .slice(0, 15);   // return required number of characters
  }
};
