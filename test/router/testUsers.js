
"use strict";
process.env.NODE_ENV = 'test';

var expect = require('chai').expect;

var mongoose = require('mongoose');
var config = require('../../config/environments/test');
var users = require('./../../app/routes/users');
var userData = require('./user.json');

var User = require('./../../app/models/user');
var request = require('supertest');
var express = require('express');
var app = express();
app.use('/api/users', users);
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var assert = chai.assert;
chai.use(chaiHttp);

describe('# Use: test router for Users ', function () {
     before(function (done) {
          mongoose.connect(config.dbUrl)
            .then(function () {
                return User.remove({});
            })
           .then(function (obj) {
                return User.create(userData);
            })
          .then(function (collection) {

                done();
            })
            .catch(function (err) {
                done(err);
            });
     });

    after(function (done) {
        mongoose.disconnect().then(done).catch(function (err) {
            done(err);
        });

    });


    it("should return list of all the users", function (done) {

        request(app)
        .get("/api/users")
        .set('Accept', 'application/json')
        .set('x-access-token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4iLCJpYXQiOjE0NzIwMzI5MTgsImV4cCI6MTQ3MjAzODMxOH0.ymTIoUWihB__mlh9oJChq2NA-NO8l-uIuWSwvSAdCO0')
        //.expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
            if (err) return done(err);
            res.should.be.json;
            res.should.have.property('status',200);
            done();
        });});
        it("should return details of a user", function (done) {

            request(app)
            .get("/api/users/admin")
            .set('Accept', 'application/json')
            .set('x-access-token','eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4iLCJpYXQiOjE0NzIwMzI5MTgsImV4cCI6MTQ3MjAzODMxOH0.ymTIoUWihB__mlh9oJChq2NA-NO8l-uIuWSwvSAdCO0')
            //.expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                res.should.be.json;
                res.should.have.property('status',200);
                done();
            });});
            
});
