'use strict';
var logger = require('../utilities/logger.js');

var express = require('express');
var router = express.Router();
var auth = require('../controllers/authenticate');


router.post('/login', function (req, res, next) {
  return auth.authenticate(req, res, next);
});

router.post('/', function (req, res, next) {
  return auth.logout(req, res, next);
});

module.exports = router;
