var cacheManager = require('cache-manager');
var s3 = new (require('aws-sdk')).S3({params:{Bucket: process.env.S3_BUCKET_NAME}});

function loadExpirationDelays() {
    expirations = {};

    if (process.env.PRERENDER_EXPIRES_DURATION) {
      var values = process.env.PRERENDER_EXPIRES_DURATION.split(";");
      for (var i = 0; i < values.length; i++) {
        kv = values[i].split("=");
        expirations[kv[0]] = expirations[kv[1]];
      }
    }

    return expirations;
}

var S3_PREFIX_KEY = process.env.S3_PREFIX_KEY;
var S3_HOST_EXPIRATIONS = loadExpirationDelays();

module.exports = {
    init: function() {
        this.cache = cacheManager.caching({
            store: s3_cache
        });
    },

    beforePhantomRequest: function(req, res, next) {
        if(req.method !== 'GET') {
            return next();
        }

        this.cache.get(req.prerender.url, function (err, result) {
            if (!err && result) {
                console.log('cache hit: ' + req.prerender.url);
                return res.send(200, result.Body);
            }
            
            next();
        });
    },

    afterPhantomRequest: function(req, res, next) {
        if(req.prerender.statusCode !== 200) {
            return next();
        }

        this.cache.set(req.prerender.url, req.prerender.documentHTML, function(err, result) {
            if (err) console.error(err);
            next();
        });
        
    }
};


var s3_cache = {
    get: function(key, callback) {
        if (S3_PREFIX_KEY) {
            key = S3_PREFIX_KEY + '/' + key;
        }

        s3.getObject({
            Key: key
        }, callback);
    },

    set: function(key, value, callback) {
        if (S3_PREFIX_KEY) {
            key = S3_PREFIX_KEY + '/' + key;
        }

        var params = {
            Key: key,
            ContentType: 'text/html;charset=UTF-8',
            StorageClass: 'REDUCED_REDUNDANCY',
            Body: value
        }

        var keys = S3_HOST_EXPIRATIONS.keys();
        for (var i = 0; i <= keys.length; i++) {
          var key = keys[0];
          if (key.indexOf(key) != -1) {
            var now = new Date();
            var value = S3_HOST_EXPIRATIONS[key];

            now.setSeconds(now.getSeconds() + parseInt(value));
            params["Expires"] = now.toString();
            break;
          }
        }

        var request = s3.putObject(params, callback);

        if (!callback) {
            request.send();
        }
    }
};
