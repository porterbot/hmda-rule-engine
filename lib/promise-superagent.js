/* global -Promise */
'use strict';

var superagent = require('superagent'),
    Promise = require('bluebird');

/**
 * A Promised GET request
 * @param  {string}  url The URL to use in a GET request
 * @return {Promise}     A {@link https://github.com/petkaantonov/bluebird|Promise} for a response body
 */
var request = function(url) {
    var deferred = Promise.defer();

    if (typeof url !== 'string') {
      deferred.reject(new Error('The URL/path must be a string.'));
    }

    superagent
        .get(url)
        .end(function(err, res) {
            if (err) {
                return deferred.reject(err);
            }
            if (res.statusCode >= 300) {
                return deferred.reject(new Error('Server responded with status code '+ res.statusCode +' for url ' + url));
            }

            deferred.resolve(res.text);
        });

    return deferred.promise;
};

module.exports = request;