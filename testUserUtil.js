(function() {
    var testUserUtil = function() {

        var $,webclient,console;
        if (this.window && this.jQuery) {
            $ = this.jQuery;
            webclient = this.jQuery;
            var noop = function() {};
            console = this.console || this.debug || { log: noop, warn: noop, error: noop };
        } else {
            $ = require('underscore')
            webclient = require('./webclient');
            console = this.console;
        }

        var baseUrl = 'https://graph.facebook.com/';

        var throwIfMissing = function(options, commandName, paramName) {
            if (!options[paramName]) {
                throwRequiredParam(commandName, paramName)
            }
        };

        var throwRequiredParam = function(commandName, paramName) {
            var msg = 'missing required param \'' + paramName + '\'';
            if (commandName) {
                msg += ' for command \'' + commandName + '\'';
            }
            throw msg;
        };

        var getAppAccessToken = function(options, callback) {
            console.log('[testUserUtil]', 'getAppAccessToken for app', options.appID);
            var url = baseUrl + 'oauth/access_token?client_id=' + options.appID + '&client_secret=' + options.apiSecret + '&grant_type=client_credentials';
            webclient.get(url, function(response) {
                if (response.indexOf('access_token') === 0) {
                    if (callback && callback.constructor === Function) {
                        callback(response.split('=')[1]);
                    }
                } else {
                    throw 'getAppAccessToken - access token not found in response: ' + response;
                }
            });
        };

        var getAllTestUsers = function(options, accessToken, callback) {
            console.log('[testUserUtil]', 'getAllTestUsers for app', options.appID);
            var url = baseUrl + options.appID + '/accounts/test-users?access_token=' + accessToken;
            webclient.get(url, function(response) {
                if (callback && callback.constructor === Function) {
                    callback(response.data);
                }
            }, 'json');
        };

        var addUserFriend = function(user, friend, callback) {
            console.log('[testUserUtil]', 'addUserFriend for users', user.id, friend.id);
            var url = baseUrl + user.id + '/friends/' + friend.id + '?method=post&access_token=' + user.access_token;
            webclient.post(url, function(response) {
                if (callback && callback.constructor === Function) {
                    callback(response);
                }
            });
        };

        var installAppUser = function(options, appAccessToken, userId, callback) {
            console.log('[testUserUtil]', 'installAppUser for app', options.appId, 'user', userId);
            var url = baseUrl + options.appID + '/accounts/test-users?installed=true&permissions=read_stream&uid=' + userId +
                '&owner_access_token=' + appAccessToken +
                '&access_token=' + appAccessToken +
                '&method=post';

            webclient.post(url, function(response) {
                if (callback && callback.constructor === Function) {
                    callback(response);
                }
            }, 'json');
        };

        var createUser = function(options, appAccessToken, callback) {
            console.log('[testUserUtil]', 'createUser for app', options.appID);
            var url = baseUrl + options.appID + '/accounts/test-users?installed=true&locale=en_US&permissions=read_stream&method=post&access_token=' + appAccessToken;
            webclient.post(url, function(response) {
                if (callback && callback.constructor === Function) {
                    callback(response);
                }
            }, 'json');
        };

        var createUsers = function(options, appAccessToken, count, callback) {
            console.log('[testUserUtil]', 'createUsers', '(' + count + ')', 'for app', options.appID);
            var users = [];
            for (var i = 0; i < count; i ++) {
                createUser(options, appAccessToken, function(testUser) {
                    users.push(testUser);
                    if (users.length === count && callback && callback.constructor === Function) {
                        callback(users);
                    }
                });
            }
        };

        var addFriends = function(options, appAccessToken, user, friends, callback) {
            var iterateFriends = function() {
                var pending = 0;

                var addFriends = function(friend) {
                    addUserFriend(user, friend, function() {
                        addUserFriend(friend, user, function() {
                            pending--;
                            if (!pending && callback && callback.constructor === Function) {
                                callback();
                            }
                        });
                    });
                };

                $.each(friends, function(friend) {
                    if (user.id !== friend.id) {
                        if (!friend.access_token) {
                            installAppUser(options, appAccessToken, friend.id, function(installedFriend) {
                                friend = installedFriend;
                                addFriends(friend);
                            });
                        } else {
                            addFriends(friend);
                        }
                        pending++;
                    }
                });
            };

            if (!user.access_token) {
                installAppUser(options, appAccessToken, user.id, function(installedUser) {
                    user = installedUser;
                    iterateFriends();
                })
            } else {
                iterateFriends();
            }
        };

        var commands = function() {

            var addFriend = function() {
                throwIfMissing(options, 'addToApp', 'userId');
                throwIfMissing(options, 'addToApp', 'friendId');


            };

            var addToApp = function() {
                throwIfMissing(options, 'addToApp', 'userId');
            };

            return {
                addFriend: addFriend,
                addToApp: addToApp,

                addTestUsers: function(options, callback) {
                    throwIfMissing(options, 'addTestUsers', 'count');

                    var done = function() {
                        console.log('[testUserUtil]', 'addTestUsers', 'done');
                        if (callback && callback.constructor === Function) {
                            callback();
                        }
                    };

                    getAppAccessToken(options, function(appAccessToken) {
                        createUsers(options, appAccessToken, parseInt(options.count), function(testUsers) {
                            if (options.friendCreatedUsers) {
                                $.each(testUsers, function(user) {
                                    addFriends(options, appAccessToken, user, testUsers, function() {
                                        done();
                                    });
                                });
                            } else if (options.friendAllUsers) {
                                getAllTestUsers(options, appAccessToken, function(existingUsers) {
                                    $.each(testUsers, function(user) {
                                        addFriends(options, appAccessToken, user, existingUsers, function() {
                                            done();
                                        });
                                    });
                                });
                            } else {
                                done();
                            }
                        });
                    });
                },

                friendAllAppUsers: function(options, callback) {
                    var done = function() {
                        console.log('[testUserUtil]', 'friendAllAppUsers', 'done');
                        if (callback && callback.constructor === Function) {
                            callback();
                        }
                    };

                    getAppAccessToken(options, function(appAccessToken) {
                        getAllTestUsers(options, appAccessToken, function(testUsers) {
                            if (options.userId) {
                                var user = $.find(testUsers, function(user) { return user.id === options.userId });
                                addFriends(options, appAccessToken, user, testUsers, function() {
                                    done();
                                });
                            } else {
                                $.each(testUsers, function(user) {
                                    addFriends(options, appAccessToken, user, testUsers, function() {
                                        done();
                                    });
                                });
                            }
                        });
                    });
                }
            }
        }();

        if (this.process && !this.window) {
            var run = function(options) {
                throwIfMissing(options, null, 'appID');
                throwIfMissing(options, null, 'apiSecret');
                throwIfMissing(options, null, 'command');

                if (options.command && commands.hasOwnProperty(options.command) && commands[options.command].constructor === Function) {
                    commands[options.command](options);
                } else if (options.command) {
                    throw 'invalid command \'' + options.command + '\'';
                }
            };
            return $.extend({ run: run }, commands);
        } else {
            for (var method in commands) {
                (function() {
                    var originalMethod = commands[method];
                    commands[method] = function(options, callback) {
                        throwIfMissing(options, null, 'appID');
                        throwIfMissing(options, null, 'apiSecret');
                        originalMethod(options, callback);
                    }
                })();
            }
            return commands;
        }
    };

    if (this.process && !this.window) {
        module.exports = testUserUtil();
    } else {
        this.window.testUserUtil = testUserUtil();
    }
})();