var assert = require('assert'),
	sinon = require('sinon'),
	prerender = require('../lib/index'),
	util = require('../lib/util')

describe('Prerender', function() {

	describe('#util', function() {

		var sandbox;

		beforeEach(function() {
			sandbox = sinon.createSandbox();
		});

		afterEach(function() {
			sandbox.restore();
		});

		it('should remove the / from the beginning of the URL if present', function() {

			var url = util.getUrl('/http://www.example.com/');

			assert.equal(url, 'http://www.example.com/');

		});

		it('should return the correct URL for #! URLs without query strings', function() {

			var url = util.getUrl('http://www.example.com/?_escaped_fragment_=/user/1');

			assert.equal(url, 'http://www.example.com/#!/user/1');

		});

		it('should return the correct URL for #! URLs with query strings', function() {

			var url = util.getUrl('http://www.example.com/?_escaped_fragment_=/user/1&param1=yes&param2=no');

			assert.equal(url, 'http://www.example.com/?param1=yes&param2=no#!/user/1');

		});

		it('should return the correct URL for #! URLs if query string is before hash', function() {

			var url = util.getUrl('http://www.example.com/?param1=yes&param2=no&_escaped_fragment_=/user/1');

			assert.equal(url, 'http://www.example.com/?param1=yes&param2=no#!/user/1');

		});

		it('should return the correct URL for #! URLs that are encoded with another ?', function() {

			var url = util.getUrl('http://www.example.com/?_escaped_fragment_=%2Fuser%2F1%3Fparam1%3Dyes%26param2%3Dno');

			assert.equal(url, 'http://www.example.com/?param1=yes&param2=no#!/user/1');

		});

		it('should return the correct URL for html5 push state URLs', function() {

			var url = util.getUrl('http://www.example.com/user/1?_escaped_fragment_=');

			assert.equal(url, 'http://www.example.com/user/1');

		});

		it('should return the correct URL for html5 push state URLs with query strings', function() {

			var url = util.getUrl('http://www.example.com/user/1?param1=yes&param2=no&_escaped_fragment_=');

			assert.equal(url, 'http://www.example.com/user/1?param1=yes&param2=no');

		});

		it('should fix incorrect html5 URL that Bing accesses', function() {

			var url = util.getUrl('http://www.example.com/?&_escaped_fragment_=');

			assert.equal(url, 'http://www.example.com/');

		});


		it('should encode # correctly in URLs that do not use the #!', function() {

			var url = util.getUrl('http://www.example.com/productNumber=123%23456?_escaped_fragment_=');

			assert.equal(url, 'http://www.example.com/productNumber=123%23456');

		});

		it('should not encode non-english characters', function() {

			var url = util.getUrl('http://www.example.com/كاليفورنيا?_escaped_fragment_=');

			assert.equal(url, 'http://www.example.com/كاليفورنيا');
		});


		it('should not decode url encoded characters', function() {
			var url = util.getUrl('http://www.example.com/?brand=h%26m&size=m');
			assert.equal(url, 'http://www.example.com/?brand=h%26m&size=m');
		});

		it('should handle fully encoded urls', function() {
			var url = util.getUrl(encodeURIComponent('http://www.example.com/?brand=h%26m&size=m'));
			assert.equal(url, 'http://www.example.com/?brand=h%26m&size=m');

			url = util.getUrl(encodeURIComponent('https://www.example.com/?brand=h%26m&size=m'));
			assert.equal(url, 'https://www.example.com/?brand=h%26m&size=m');
		});

		it('should handle params before and after #!', function() {
			var url = util.getUrl('www.example.com?user=userid&_escaped_fragment_=key1=value1%26key2=value2');
			assert.equal(url, 'www.example.com?user=userid#!key1=value1&key2=value2');
		})

	});
});
