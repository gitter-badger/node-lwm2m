/*
 * Copyright 2017 Alexandre Moreno <alex_moreno@tutk.com>
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

var debug = require('debug')('lwm2m');
var Window = require('./slidingWindow');
var url = require('url');

module.exports = function(options) {
  var routes = options.routes;
  var window = new Window(options.udpWindow);
  var server = options.server;

  return function(req, res) {
    if (req.code === '0.00' && req._packet.confirmable && 
      req.payload.length === 0) {
      return res.reset();
    }

    var mid = req._packet.messageId;

    if (window.contains(mid)) {
      debug('Discarding duplicate message');
      return;
    }

    window.push(mid);

    var method = req.method;
    var pathname = url.parse(req.url).pathname;
    var middlewares = [];
    var result = Promise.resolve();

    routes.forEach(function(route) {
      if (method === route[0] && pathname.match(route[1])) {
        middleware.push(route[2]);
      }
    });

    middlewares.forEach(function(m) {
      result = result.then(function() {
        return m(req, res);
      });
    });
  };
};
