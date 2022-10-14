// This is copied from basicAuth.js
if (!process.env.BASIC_AUTH) {
  throw new Error("missing BASIC_AUTH env var");
}
const CREDS = process.env.BASIC_AUTH.split(",").map((cred) =>  cred.split(":"));

if (CREDS.length < 1 || CREDS[0].length !== 2) {
  throw new Error("BASIC_AUTH must specify at least one credential pair");
}

module.exports = {
  requestReceived(req, res, next) {
    if (req.prerender.url == process.env.STATUS_URL) {
      const username = CREDS[0][0];
      const password = CREDS[0][1];
      const buf = new Buffer(username + ":" + password).toString("base64");
      req.headers.authorization = `Basic ${buf}`;
    }
    return next();
  }
};
