#!/usr/bin/env node
var prerender = require('./lib');

var server = prerender({
    workers: process.env.PRERENDER_NUM_WORKERS,
    iterations: process.env.PRERENDER_NUM_ITERATIONS
});

server.use({
  beforePhantomRequest: function(req,res,next) {
    if (req.prerender.url == process.env.STATUS_URL) {
       var username = process.env.BASIC_AUTH_USERNAME;
       var password = process.env.BASIC_AUTH_PASSWORD;
       var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
       req.headers.authorization = auth;
    }
    next();
  }
});

server.use(prerender.basicAuth());
server.use(prerender.sendPrerenderHeader());
// server.use(prerender.whitelist());
server.use(prerender.blacklist());
// server.use(prerender.logger());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());
// server.use(prerender.inMemoryHtmlCache());

server.use(prerender.s3HtmlCache());
//server.use(require("prerender-memcached-cache"));

server.start();
