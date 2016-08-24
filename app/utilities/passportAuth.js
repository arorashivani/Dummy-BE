'use strict';
var logger=require('../utilities/logger.js');

var JwtStrategy = require('passport-jwt').Strategy,
    extractJwt = require('passport-jwt').ExtractJwt,
    user = require('../models/users');


//module.exports = function (passport) {
//    var opts = {}
//    opts.jwtFromRequest = extractJwt.fromHeader('authToken');
//    opts.secretOrKey = process.env.JWT_SECRET;
//    opts.issuer = "launchvms.com";
//    opts.expires = 7200;//expires in 2 hrs
//
////opts.audience = "yoursite.net";
//    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
//        user.findOne({id: jwt_payload.sub}, function (err, user) {
//            if (err) {
// logger.error(err);
//                return done(err, false);
//            }
//            if (user) {
//                done(null, user);
//            } else {
//                done(null, false);
//                // or you could create a new account
//            }
//        });
//    }));
//
//};
