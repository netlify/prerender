"use strict";

const prerender = require("prerender");
const server = prerender();

server.use(require("./lib/plugins/healthCheckAuth"));
server.use(prerender.basicAuth());
server.use(prerender.sendPrerenderHeader());
server.use(prerender.blacklist());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());
server.use(require("./lib/plugins/s3HtmlCache"));

server.start();
