var request = require('request');
var querystring = require('querystring');
var extend = require('util')._extend;

module.exports = function(opts) {
    opts = opts || {};

    // API base URL
    const baseUrl = 'https://www.strava.com/';

    // API info
    const strava = {
        url: {
            api: baseUrl + 'api/v3/',
            auth: baseUrl + 'oauth/'
        }
    }

    // Client info
    const client = {
        credentials: {
            access_token: false,
            client_id: false,
            client_secret: false
        }
    }

    // HTTP request types to support
    const supportedHttpVerbs = ['get', 'post', 'put', 'del'];

    // Our returned client
    var api = {}

    // Sets up our client
    var init = function() {
        // Assign credentials
        for (prop in opts) {
            setCredential(prop, opts[prop]);
        }

        // Assign methods to API
        supportedHttpVerbs.map(function(verb) {
            api[verb] = addRequestMethod(verb);

            return verb;
        });

        api.setCredential = setCredential;
        api.getAuthUrl = getAuthUrl;

        api.tokenExchange = tokenExchange;

        return api;
    }

    // Throw module specific error
    var error = function(message) {
        message = message || '';

        return new Error('bikedujour.strava-api.error: ' + message);
    }

    // Set client credential
    var setCredential = function(name, val) {
        if (name in client.credentials) {
            client.credentials[name] = val;
        }
    }

    // Get client credential
    var getCredential = function(name) {
        return client.credentials[name];
    }

    // Setup an API request URL
    var setupRequestUrl = function(path, params, type) {
        params = params || {};
        type = type || 'api';
        path = path.substr(-1) === '/' ? path.substr(0, path.length - 1) : path;

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
    var makeRequest = function(method, path, params, cb) {
        var accessToken = getCredential('access_token');

        if (typeof accessToken !== 'string') {
            throw(error('Invalid API access token'));
        }

        return request[method]({
            url: setupRequestUrl(path, params),
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        }, function(err, res, body) {
            if (res.statusCode !== 200) {
                err = error('statusCode (' + res.statusCode + ')');
            }

            return cb(err, parseResponse(body));
        });
    }

    // Register our HTTP verbs
    var addRequestMethod = function(method) {
        return function(path, params, cb) {
            if (typeof params === 'function') {
                cb = params;
                params = {};
            }

            return makeRequest(method, path, params, cb);
        }
    }

    // Returns an authentication URL
    var getAuthUrl = function(params) {
        if (typeof params !== 'object') {
            throw(error('Please specify a parameter object'));
        }

        if (! params.redirect_uri) {
            throw(error('Please specify a "redirect_uri" parameter'));
        }

        var requestParams = extend({
            client_id: getCredential('client_id'),
            response_type: 'code',
        }, params);

        return setupRequestUrl('authorize', requestParams, 'auth');
    }

    // Exchange code for permanent access_token
    var tokenExchange = function(code, cb) {
        var params = {
            code: code,
            client_id: getCredential('client_id'),
            client_secret: getCredential('client_secret')
        }

        console.log(setupRequestUrl('token', params, 'auth'));

        return request.post(setupRequestUrl('token', params, 'auth'), function(err, res, body) {
            if (res.statusCode !== 200) {
                err = error('statusCode (' + res.statusCode + ')');
            }

            console.log(body);

            var data = parseResponse(body);

            if (data.access_token) {
                setCredential('access_token', data.access_token);
            }

            return cb(err, data);
        });
    }

    return init();
}
