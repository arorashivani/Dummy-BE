'use strict';
var logger=require('../utilities/logger.js');

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {

    res.json({message: 'Hooray! Welcome to our HCL Backend API!'});

});

module.exports = router;
