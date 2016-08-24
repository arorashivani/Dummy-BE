'use strict';

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var nodemon = require('gulp-nodemon');
var prompt=require('gulp-prompt');
var fs = require('fs');

var jsFiles = ['./*.js', 'app/**/*.js', 'config/**/*.js'];

var mongoose = require('mongoose');
var dbConfig = require('./config/environments/dev.js');
var dbConnErr = false;
var pump = require('pump');

//setting environment
var environment = process.env.NODE_ENV || 'development';

gulp.task('process-scripts', function (cb) {
  pump([
      gulp.src(jsFiles),
        jshint(),
        uglify(),
        jshint.reporter('default'),
        jshint.reporter('fail'),
        gulp.dest('dist/app')
  ],
    cb);
});

//watch task
gulp.task('default', ['process-scripts'], function () {
  var options = {
    script: 'bin/www',
    delayTime: 1,
    env: {
      'PORT': 3000
    },
    watch: jsFiles
  };
  return nodemon(options)
  .on('restart', function () {
    console.log('Restarting.....');
  });
  
});


//function to create database connection
var createDBConnection = function(){
  mongoose.connect(dbConfig.development.db);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error...'));
  db.once('open', function callback() {
    console.log('mspvms db opened');
  });
};

//function to close database connection
var closeDBConnection = function(){
  mongoose.connection.close();
};
