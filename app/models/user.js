'use strict';
var logger=require('../utilities/logger.js');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var encrypt = require('./../utilities/encryption');
//userSchema.set('validateBeforeSave', false);


var userSchema = new Schema({

  username: { type: String, required: true, lowercase: true },
  salt: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: false },
  location: { type: String, required: false },
  fName: { type: String, required: false },
  authToken: {
    token: { type: String },
    expiresAt: { type: Date }
  },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, default: null },
}, { minimize: false });
userSchema.index({ 'username': 1 }, { unique: true });

userSchema.set('validateBeforeSave', false);
module.exports.userSchema = userSchema;



userSchema.methods = {
    authenticate: function (passwordToMatch) {
		return encrypt.hashPwd(this.salt, passwordToMatch) === this.hashPwd;
    },
    hasRole: function (role) {
        return this.roles.indexOf(role) > -1;
    },
    sample :function(){
    	logger.debug('hi');
    }
};

userSchema.statics = {
  createDefaultUsers: function () {
    User.find(function(err,result){
      if(result.length === 0){
        var data = [{'username':'admin','password':'admin','salt':'','role':'Admin','location':'Noida','fName':'ADMIN'},
                    {'username':'hcltech','password':'hcltech','salt':'','role':'Admin','location':'Noida','fName':'HCL'},
                    {'username':'avengers','password':'avengers','salt':'','role':'Admin','location':'Noida','fName':'Steve'},
                    {'username':'megatron','password':'megatron','salt':'','role':'Admin','location':'Noida','fName':'Prime'},
                    {'username':'ironman','password':'ironman','salt':'','role':'Admin','location':'Noida','fName':'Tony'},
                    {'username':'superman','password':'superman','salt':'','role':'Admin','location':'Noida','fName':'Clark'}];
        var count = 0 ;
        var final =
        data.map(function (item) {
          return User.createDefaultPassword(item);
        });
      }
    });
  },
  createDefaultPassword: function (item) {
    item.salt = encrypt.CreateSalt();
  return encrypt.HashPwd(item.salt, item.password)
      .then(function (val) {item.password = val;
        var user = new User(item);
      user.save(function(err){if(err){console.log(err);}});
    });
  }
};

var User = mongoose.model('User', userSchema);

//exporting model
module.exports = User;
