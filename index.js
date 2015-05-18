var request = require('request');
var querystring = require('querystring');

module.exports = function(opts) {
    // API base URL
    const baseUrl = 'https://www.strava.com/';

    // API INFO
    const strava = {
        url: {
            api: baseUrl + 'api/v3/',
            auth: baseUrl + 'oauth/'
        }
    }

    // Our returned client
    var api = {}

    // Sets up our client
    var init = function() {
        if (typeof opts.token === 'string') {
            strava.token = opts.token
        }

        // Assign methods to API
        api.get = function(path, params, cb) {
            return addRequestMethod('get', path, params, cb);
        };

        api.post = function(path, params, cb) {
            return addRequestMethod('post', path, params, cb);
        };

        api.put = function(path, params, cb) {
            return addRequestMethod('put', path, params, cb);
        };

        api.delete = function(path, params, cb) {
            return addRequestMethod('delete', path, params, cb);
        };

        api.setAccessToken = function(token) {
            strava.token = token;
        }

        api.buildAccessRequest = function(params) {
            params = params || {};
            params.response_type = 'code';
            params.redirect_uri = opts.redirect_uri;
            params.client_id = opts.client_id;
            
            return setupRequestUrl('authorize', params, 'auth');
        };

        api.tokenExchange = function(code, cb) {
            //swap temp code for permanent token and pass token into cb
                //make post request to strava.url.auth /token
                //call cb(data)
        }

        return api;
    }

    var error = function(message) {
        message = message || '';

        return new Error('bikedujour.strava-api.error: ' + message);
    }

    var setupRequestUrl = function(path, params, type) {
        params = params || {};
        type = type || 'api';
        path += path.substr(-1) === '/' ? '' : '/';

        return [strava.url[type], path, '?',querystring.stringify(params)].join('');
    }

    // Parses JSON to object
    var parseResponse = function(res) {

        if (typeof res === 'string') {
            try{
                return JSON.parse(res);
            } catch(e) {
                return false;
            }
        }

        return false;
    }

    // Abstract requester
    var req = function(method, path, params, cb) {
        if (typeof strava.token !== 'string') {
            throw(error('Invalid API access token'));
        }

        return request[method]({
            url: setupRequestUrl(path, params),
            headers: {
                Authorization: 'Bearer ' + strava.token
            }
        }, function(err, res, body) {
            if (res.statusCode !== 200) {
                err = error('statusCode (' + res.statusCode + ')');
            }

            return cb(err, parseResponse(body));
        });
    }

    // Register our HTTP verbs
    var addRequestMethod = function(method, path, params, cb) {
        if (typeof params === 'function') {
            cb = params;
            params = {};
        }

        return req(method, path, params, cb);
    }

    return init();
}
