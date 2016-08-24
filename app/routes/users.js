'use strict';
var logger=require('../utilities/logger.js');

var express = require('express');
var router = express.Router();

var userController = require('../controllers/users');


router.get('/', function(req, res, next) {
  userController.getUsers(req, res, next);
});

router.get('/:userName', function(req, res, next) {
    userController.getUser(req, res, next);
});

router.put('/:userName', function(req, res, next) {
  userController.updateUser(req, res, next);
});

router.post('/', function(req, res, next) {
  userController.createUser(req, res, next);
});


module.exports = router;
