const cacheManager = require("cache-manager");
const AWS = require("aws-sdk");
const util = require("../util");

module.exports = {
  init() {
    const s3 = new AWS.S3({ params: { Bucket: process.env.S3_BUCKET_NAME } });
    this.prefix = process.env.S3_PREFIX_KEY;
    this.expirations = [];
    if (process.env.PRERENDER_EXPIRES_DURATION) {
      const values = process.env.PRERENDER_EXPIRES_DURATION.split(";");
      values.forEach(v => {
        this.expirations.push(v.split("="));
      });
    }

    this.cache = cacheManager.caching({
      store: new S3Cache(s3)
    });
  },

  _prefixedKey(key) {
    if (this.prefix) {
      return `${this.prefix}/${key}`;
    }
    return key;
  },

  requestReceived(req, res, next) {
    if (req.method !== "GET") {
      return next();
    }

    this.cache.get(this._prefixedKey(req.prerender.url), function(err, result) {
      if (!err && result) {
        req.prerender.cacheHit = true;
        return res.send(200, result);
      }

      if (err && err.statusCode !== 404 && err.statusCode !== 403) {
        util.log(`S3 GET failed error="${err}" url="${req.prerender.url}"`);
      }
      return next();
    });
  },

  beforeSend(req, res, next) {
    if (req.prerender.statusCode !== 200 || req.prerender.cacheHit) {
      return next();
    }

    const pkey = this._prefixedKey(req.prerender.url);
    const opts = {};
    this.expirations.some(kv => {
      const [expKey, ttl] = kv;
      const matches = pkey.indexOf(expKey) != -1;
      if (matches) {
        opts.ttl = Number(ttl);
        util.log(`host_match=${expKey} url="${pkey}" ttl=${opts.ttl}`);
      }
      return matches;
    });

    this.cache.set(pkey, req.prerender.content, opts, function(err) {
      if (err) {
        util.log(`S3 PUT failed error="${err}" url="${req.prerender.url}"`);
      }
    });

    return next();
  }
};

class S3Cache {
  constructor(s3) {
    this.s3 = s3;
  }

  get(key, opts, cb) {
    if (typeof opts === "function") {
      cb = opts;
      opts = {};
    }
    this.s3
      .getObject({ Key: key })
      .promise()
      .then(data => {
        cb(null, data.Body);
      })
      .catch(err => {
        cb(err);
      });
  }

  set(key, value, opts, cb) {
    if (typeof opts === "function") {
      cb = opts;
      opts = {};
    }

    const params = {
      Key: key,
      ContentType: "text/html;charset=UTF-8",
      StorageClass: "REDUCED_REDUNDANCY",
      Body: value
    };

    if (opts.ttl) {
      const now = Date.now();
      now.setSeconds(now.getSeconds() + Number(opts.ttl));
      params["Expires"] = now;
    }
    this.s3.putObject(params, cb);
  }
}
