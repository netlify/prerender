var cacheManager = require('cache-manager');
var s3 = new (require('aws-sdk')).S3({params:{Bucket: process.env.S3_BUCKET_NAME}});

function loadExpirationDelays() {
    expirations = [];

    if (process.env.PRERENDER_EXPIRES_DURATION) {
      var values = process.env.PRERENDER_EXPIRES_DURATION.split(";");
      for (var i = 0; i < values.length; i++) {
        expirations.push(values[i].split("="));
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
                console.log('state=CACHE_HIT url="' + req.prerender.url + '"');
                return res.send(200, result.Body);
            } else {
                console.log('state=CACHE_MISS url="' + req.prerender.url + '"');
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

        for (var i = 0; i < S3_HOST_EXPIRATIONS.length; i++) {
          var kv = S3_HOST_EXPIRATIONS[i];

          if (key.indexOf(kv[0]) != -1) {
            var now = new Date();

            now.setSeconds(now.getSeconds() + parseInt(kv[1]));
            params["Expires"] = now.toString();
            console.log('host_match=' + kv[0] + 'url="' + key + '" expires="'+ now.toString() +'"');
            break;
          }
        }

        var request = s3.putObject(params, callback);

        if (!callback) {
            request.send();
        }
    }
};
