'use strict';
var logger=require('../utilities/logger.js');

var express = require('express');
var router = express.Router();
var register = require('../controllers/register');

router.route('/')
.post(function (req, res, next) {
  register.registerUser(req, res, next);
});

router.get('/getRegistrationData/:rToken',function(req, res, next) {
  register.getRegistrationData(req, res, next);
});

router.put('/checkPassword',function(req, res, next) {
  register.checkPassword(req, res, next);
});

router.get('/:rToken',function(req, res, next) {
  register.getRegistrationData(req, res, next);
});

router.post('/secQuestion', function(req, res, next) {
  register.getSecQuestion(req, res, next);
});

router.post('/validateSecurityAns', function(req, res, next) {
  register.getSecAnswer(req, res, next);
});

router.put('/resetPassword', function(req, res, next) {
  register.checkUser(req, res, next);
});

/*router.put('/changePassword', function(req, res, next) {
  register.changePassword(req, res, next);
});*/

router.put('/updateSecurityAns', function(req, res, next) {
  register.changeSecurityAns(req, res, next);
});
/*
router.get('/checkPassword',function(req, res, next) {
  register.checkPassword(req, res, next);
});*/

router.post('/forgotSecAns',function(req, res, next) {
  register.forgotSecAns(req, res, next);
});

module.exports = router;
