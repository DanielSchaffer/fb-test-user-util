var   _         = require('underscore')
    , protocols = {
        http:     require('http')
       ,https:    require('https')
    };

module.exports = function() {

    var method = {
        get: {
            hasRequestBody: false,
            hasResponseBody: true
        },
        post: {
            hasRequestBody: true,
            hasResponseBody: true
        },
        head: {
            hasRequestBody: false,
            hasResponseBody: false
        },
        put: {
            hasRequestBody: true,
            hasResponseBody: true
        },
        delete: {
            hasRequestBody: false,
            hasResponseBody: true
        }
    };
    for (var name in method) {
        method[name].name = name.toUpperCase();
    }

    var httpMethod = function(method) {
        return function(url, data, callback, type) {

            if (callback && callback.constructor === String) {
                type = callback;
                callback = undefined;
            }

            if (data && data.constructor === Function) {
                callback = data;
                data = undefined;
            }

            var protocol = url.substring(0, url.indexOf(':'));
            if (!protocols.hasOwnProperty(protocol)) {
                throw 'unsupported protocol: ' + protocol;
            }

            var options = {
                method: method.name,
                host: url.substring(url.indexOf(':') + 3, url.indexOf('/', url.indexOf(':') + 3)),
                path: url.substring(url.indexOf('/', url.indexOf(':') + 3))
            };

            if (type && method.hasRequestBody && data) {
                if (!options.headers) {
                    options.headers = {};
                }
                if (type === 'json') {
                    options.headers['Content-Type'] = 'application/json';
                    options.headers['Accept'] = 'application/json';
                } else {
                    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
            }

            if (data && !method.hasRequestBody) {
                var query = '';
                for (var param in data) {
                    if (query) {
                        query += '&';
                    }
                    query += param + '=' + data[param];
                }
                options.path += ((options.path.indexOf('?') < 0 ? '?' : '') + query);
            }

            //console.log('[webclient]', 'making request:', options);
            var req = protocols[protocol].request(options, function(res) {
                var content;
                if (method.hasResponseBody) {
                    content = '';
                    res.on('data', function(chunk) {
                        content += chunk;
                    });
                }

                res.on('end', function() {
                    var contentType = res.headers['Content-Type'];
                    if ((contentType && contentType.indexOf('application/json') >= 0) || type === 'json') {
                        content = JSON.parse(content);
                    } else {
                        //console.log('[webclient]', 'response content type:', contentType);
                    }

                    if (callback) {
                        callback(content, req, res);
                    }
                });
            });

            if (method.hasRequestBody && data) {
                if (type === 'json') {
                    req.write(JSON.stringify(data));
                } else {
                    var body = '';
                    for (var key in data) {
                        if (body) {
                            body += '&';
                        }
                        body += key + '=' + data[key];
                    }
                    req.write(body);
                }
            }
            req.end();
        };
    };

    return {
        get: httpMethod(method.get),
        post: httpMethod(method.post),
        head: httpMethod(method.head),
        put: httpMethod(method.put),
        delete: httpMethod(method.delete)
    };
}();