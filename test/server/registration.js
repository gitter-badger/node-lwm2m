/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of node-lwm2m
 *
 * node-lwm2m is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * node-lwm2m is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with node-lwm2m.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */

'use strict';

var should = require('should');
var lwm2m = require('../../');
var coap = require('coap');
var port = 5683;
var server;
var payload = '</1>,</2>,</3>,</4>,</5>';
var ep = 'test';
var location;

describe('Registration', function() {
  beforeEach(function (done) {
    server = lwm2m.createServer({ type: 'udp4' });
    server.on('error', done);
    server.listen(port, done);
  });
  afterEach(function(done) {
    setImmediate(function() {
      server.close(done);
    });
  });

  describe('#register', function() {
    it('should fail with a 4.00 Bad Request when missing endpoint name', function(done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: '/rd',
        query: 'lt=86400&lwm2m=1.0&b=U'
      });

      server.on('register', function(params, accept) {
        accept();
      });

      req.on('response', function(res) {
        res.code.should.equal('4.00');
        done();
      });

      req.end(payload);
    });

    it('should return a 2.01 Created', function(done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: '/rd',
        query: 'ep=test&lt=86400&lwm2m=1.0&b=U'
      });

      server.on('register', function(params, accept) {
        accept();
      });

      req.on('response', function(res) {
        res.code.should.equal('2.01');
        done();
      });

      req.end(payload);
    });

    it('should return a 2.01 Created when missing lifetime', function(done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: '/rd',
        query: 'ep=test&lwm2m=1.0&b=U'
      });

      server.on('register', function(params, accept) {
        accept();
      });

      req.on('response', function(res) {
        res.code.should.equal('2.01');
        done();
      });

      req.end(payload);
    });

    it('should emit register event with query params', function (done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: '/rd',
        query: 'ep=test&lt=86400&lwm2m=1.0&b=U'
      });
      var request = {};

      server.on('register', function(params, accept) {
        request = params;
        accept();
      });

      req.on('response', function(res) {
        res.code.should.equal('2.01');
        request.should.have.properties(['ep', 'lt', 'lwm2m', 'b']);
        request.payload.should.be.a.String();
        done();
      });

      req.end(payload);
    });

    it('should set Location-Path Option', function (done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: '/rd',
        query: 'ep=test&lt=86400&lwm2m=1.0&b=U'
      });

      server.on('register', function(params, accept) {
        accept();
      });

      req.on('response', function(res) {
        res.headers['Location-Path'].should.match(/rd\/\w+/);
        done();
      });

      req.end(payload);
    });

    it('should fail with a 4.00 Bad Request when user rejects endpoint', function(done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: '/rd',
        query: 'ep=test&lt=86400&lwm2m=1.0&b=U'
      });

      server.on('register', function(params, accept) {
        accept(new Error('unknown'));
      });

      req.on('response', function(res) {
        res.code.should.equal('4.00');
        done();
      });

      req.end(payload);

    });
  });

  describe('#update', function() {

    beforeEach(function (done) {
      server.on('register', function(params, accept) {
        accept();
      });

      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: '/rd',
        query: 'ep=' + ep + '&lt=86400&lwm2m=1.0&b=U'
      });

      req.on('response', function(res) {
        location = res.headers['Location-Path'];
        done();
      });

      req.end(payload);
    });

    it('should return a 2.04 Changed', function(done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: location,
        query: 'lt=86400&lwm2m=1.0&b=U'
      });

      server.on('update', function(params, accept) {
        accept();
      });

      req.on('response', function(res) {
        res.code.should.equal('2.04');
        done();
      });

      req.end(payload);
    });
  });

  describe('#deregister', function() {
    beforeEach(function(done) {
      server.on('register', function(params, accept) {
        accept();
      });

      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'POST',
        pathname: '/rd',
        query: 'ep=' + ep + '&lt=86400&lwm2m=1.0&b=U'
      });

      req.on('response', function(res) {
        location = res.headers['Location-Path'];
        done();
      });

      req.end(payload);
    });

    it('should return a 2.02 Deleted', function(done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'DELETE',
        pathname: location
      });
      var params;

      server.on('unregister', function(location, callback) {
        params = location;
        callback();
      });

      req.on('response', function(res) {
        params.should.be.equal(location);
        res.code.should.equal('2.02');
        done();
      });

      req.end();
    });

    it('should return a 4.04 Not found for unknown client', function(done) {
      var req = coap.request({
        host: 'localhost',
        port: port,
        method: 'DELETE',
        pathname: '/rd/136'
      });

      server.on('unregister', function(location, callback) {
        should.fail('calling user handler for a bad request');
        callback();
      });

      req.on('response', function(res) {
        res.code.should.equal('4.04');
        done();
      });

      req.end();
    });
  });
});

