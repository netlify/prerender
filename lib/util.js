module.exports = {
  log() {
    console.log.apply(
      console.log,
      [new Date().toISOString()].concat(
        Array.prototype.slice.call(arguments, 0)
      )
    );
  }
};
const url = require('url');

const util = exports = module.exports = {};

// Normalizes unimportant differences in URLs - e.g. ensures
// http://google.com/ and http://google.com normalize to the same string
util.normalizeUrl = function(u) {
	return url.format(url.parse(u, true));
};

util.getOptions = function(req) {

	var requestedUrl = req.url;

	//new API starts with render so we'll parse the URL differently if found
	if(requestedUrl.indexOf('/render') === 0) {

		let optionsObj = {};
		if(req.method === 'GET') {
			optionsObj = url.parse(requestedUrl, true).query;
		} else if (req.method === 'POST') {
			optionsObj = req.body;
		}

		return {
			url: util.getUrl(optionsObj.url),
			renderType: optionsObj.renderType || 'html',
			userAgent: optionsObj.userAgent,
			fullpage: optionsObj.fullpage || false,
			width: optionsObj.width,
			height: optionsObj.height,
			followRedirects: optionsObj.followRedirects,
			javascript: optionsObj.javascript
		}

	} else {

		return {
			url: util.getUrl(requestedUrl),
			renderType: 'html'
		}
	}
}

// Gets the URL to prerender from a request, stripping out unnecessary parts
util.getUrl = function(requestedUrl) {
	if (!requestedUrl) {
		return '';
	}

	var realUrl = requestedUrl.replace(/^\//, '');

	// check if the entire url has been encoded and decode it first
	if (realUrl.startsWith("http%3A%2F%2F") || realUrl.startsWith("https%3A%2F%2F")) {
		realUrl = decodeURIComponent(realUrl);
	}
	var parts = url.parse(realUrl, true);

	// Remove the _escaped_fragment_ query parameter
	if (parts.query && parts.query['_escaped_fragment_'] !== undefined) {
		const fragment = url.parse(decodeURIComponent(parts.query['_escaped_fragment_']), true);

		if (fragment.pathname) {
			parts.hash = '#!' + fragment.pathname;
		}

		// If _escaped_fragment_ had a query embedded in it with a ?, merge it with the
		// url params here.
		parts.query = { ...parts.query, ...fragment.query };

		delete parts.query['_escaped_fragment_'];
		delete parts.search;
	}

	// Bing was seen accessing a URL like /?&_escaped_fragment_=
	delete parts.query[''];

	return url.format(parts);
};

util.encodeHash = function(url) {
	if (url.indexOf('#!') === -1 && url.indexOf('#') >= 0) {
		url = url.replace(/#/g, '%23');
	}

	return url;
}

util.log = function() {
	if (process.env.DISABLE_LOGGING) {
		return;
	}

	console.log.apply(console.log, [new Date().toISOString()].concat(Array.prototype.slice.call(arguments, 0)));
};
