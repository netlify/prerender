module.exports = {
  requestReceived(req, res, next) {
    if (req.prerender.url == process.env.STATUS_URL) {
      const username = process.env.BASIC_AUTH_USERNAME;
      const password = process.env.BASIC_AUTH_PASSWORD;
      const buf = new Buffer(username + ":" + password).toString("base64");
      req.headers.authorization = `Basic ${buf}`;
    }
    return next();
  }
};
