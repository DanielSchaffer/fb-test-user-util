fb-test-user-util
=================

a javascript-based utility for adding test users and creating relationships between test users.

## running the utility

This utility can be run either as a node.js script, or using a web browser with a console.

### node.js

After cloning, run `npm install` in the cloned folder once. To run from the command line, run `node app command [commandname]` along with the required parameters from within the cloned folder.

Parameters are specified in pairs separated by spaces. For example:

    node app command addTestUsers count 1 appID 1234 apiSecret abcd

The above executes the `addTestUsers` command, and passes the value `1` for the `count` parameter.

### web-based

After cloning, open the `index.html` file, which is used as the host. To run commands, open the web browser's javascript console. All parameters are passed in an options object. To run the `addTestUsers` command:

    testUserUtil.addTestUsers({ count: 1, appID: '1234', apiSecret: 'abcd' });

Additionally, each command takes an optional callback parameter which is called when the command is complete:

    testUserUtil.addTestUsers({ count: 1, appID: '1234', apiSecret: 'abcd' }, function() {
        console.log('done!');
    });

## commands

The following parameters are required for all commands:

* **appID** - the app's API key/app ID
* **apiSecret** - the app's API secret

### addTestUsers
Adds one or more test users to the app, and optionally adds them as friends to eachother or to all existing app test users.

**Required Parameters**
  * **count** - *number* - the number of new test users to add

**Optional Parameters**
  * **friendCreatedUsers** - *boolean* - adds the created test users to eachothers friends lists
  * **friendAllUsers** - *boolean* - adds all the created, and all existing test users, to eachothers friends lists
  * *note* - if both `friendCreatedUsers` and `friendAllUsers` are specified, the `friendCreatedUsers` behavior is used.

### friendAllAppUsers
Adds all test users to the user's friends list, if specified, or adds all test users to eachothers friends lists.

**Optional Parameters**
  * **userId** - *string* - the FB user id of the test user to add friends to

### deleteUsers
Deletes one or more specific test users, or all test users of an app.

*note* - Test users that have been added to multiple apps cannot be deleted until they are removed from the other apps.

**Required Parameters**
  * **users** - "all" *or* *userlist*
    * `all` - deletes all test users of the app
    * `userlist` - a comma separated uid list (no spaces!), deletes all users in the list