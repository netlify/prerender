"use strict";

const http = require("http");
const util = require("./lib/util");
const server = require("prerender/lib/server");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const compression = require("compression");
const morgan = require("morgan");

server.init({});
server.onRequest = server.onRequest.bind(server);

morgan.token("request_id", function(req, res) {
  const rhdr = process.env.REQUEST_ID_HEADER;
  if (rhdr && req.headers[rhdr]) {
    return req.headers[rhdr];
  }
  return "unknown";
});

morgan.token("cache_type", function(req, res) {
  return req.prerender.cacheHit ? "CACHE_HIT" : "CACHE_MISS";
});

app.use(
  morgan(
    `:date[iso] method=:method url=:url status=:status cache_type=:cache_type rsp_content_length=:res[content-length] timing=:response-time referrer=:referrer user_agent=":user_agent" request_id=:request_id`
  )
);
app.disable("x-powered-by");
app.use(compression());
app.use(function(err, req, res, next) {
  res.status(500).end();
  util.log(`Unhandled request error error=${err} stack=${err.stack}`);
});

app.get("*", server.onRequest);

//dont check content-type and just always try to parse body as json
app.post("*", bodyParser.json({ type: () => true }), server.onRequest);

server.use(require("./lib/plugins/healthCheckAuth"));
server.use(require("prerender/lib/plugins/basicAuth"));
server.use(require("prerender/lib/plugins/sendPrerenderHeader"));
server.use(require("prerender/lib/plugins/blacklist"));
server.use(require("prerender/lib/plugins/removeScriptTags"));
server.use(require("prerender/lib/plugins/httpHeaders"));
server.use(require("./lib/plugins/s3HtmlCache"));

server.start();

const port = process.env.PORT || 3000;
app.listen(port, () =>
  util.log(`Prerender server accepting requests on port ${port}`)
);
