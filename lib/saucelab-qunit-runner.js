var Promise = require('promise'),
    request = require('request');

var QUnitTestRunner = module.exports = function (options) {
    this.options = {
        username: options.username || '',
        key:      options.key || '',
        browsers: options.browsers || [],
        testName: options.testName || 'QUnit tests',
        tags:     options.tags || ['master'],

        urls:             [
            "http://127.0.0.1:1335/test-qunit/test1.html",
            "http://127.0.0.1:1335/test-qunit/test2.html"
        ],
        tunnelTimeout:    5,
        concurrency:      3,
        tunnelIdentifier: options.tunnelIdentifier || Math.floor((new Date()).getTime() / 1000 - 1230768000).toString(),
        pollInterval:     1000 * 2,
        tunnelArgs:       [],
        sauceConfig:      {},
        maxRetries:       0
    };
};

QUnitTestRunner.prototype._sendRequest = function (params) {
    var sendRequest = Promise.denodeify(request);

    return sendRequest(params)
        .then(function (result) {
            var statusCode = result.statusCode;
            var body       = result.body;

            if (statusCode !== 200) {
                throw [
                    'Unexpected response from the Sauce Labs API.',
                    params.method + ' ' + params.url,
                    'Response status: ' + statusCode,
                    'Body: ' + JSON.stringify(body)
                ].join('\n');
            }

            return body;
        },
        function (error) {
            throw 'Could not connect to Sauce Labs API: ' + error.toString();
        }
    );
};

QUnitTestRunner.prototype.runTests = function (callback) {
    var runner          = this;
    var browser         = this.options.browsers[0];
    var runTestPromises = [];

    for (var i = 0; i < this.options.urls.length; i++) {
        var runTest = runner.startTask(browser, this.options.urls[i])
            .then(function (taskId) {
                return runner.completeTask(taskId);
            })
            .then(function (result) {
                return result;
            });

        runTestPromises.push(runTest);
    }

    Promise.all(runTestPromises)
        .then(function () {
            callback(arguments);
        })
        .catch(function (err) {
            console.log('RUN TESTS ERROR: ', err);
        });
};

QUnitTestRunner.prototype.startTask = function (browser, url) {
    var params = {
        method: 'POST',
        url:    ['https://saucelabs.com/rest/v1', this.options.username, 'js-tests'].join('/'),
        auth:   { user: this.options.username, pass: this.options.key },
        json:   {
            platforms:           [[browser.platform || '', browser.browserName || '', browser.version || '']],
            url:                 url,
            framework:           'qunit',
            //build: this.build,
            tags:                this.options.tags,
            name:                this.options.testName,
            'tunnel-identifier': this.options.tunnelIdentifier
        }
    };

    return this._sendRequest(params)
        .then(function (body) {
            var taskIds = body['js tests'];

            if (!taskIds || !taskIds.length)
                throw 'Error starting tests through Sauce API: ' + JSON.stringify(body);

            return taskIds[0];
        });
};

QUnitTestRunner.prototype.completeTask = function (taskId) {
    return this._waitForTaskCompleted(taskId)
        .then(function (result) {
            return result;
        });
};

QUnitTestRunner.prototype._waitForTaskCompleted = function (taskId) {
    var runner = this;
    var params = {
        method: 'POST',
        url:    ['https://saucelabs.com/rest/v1', runner.options.username, 'js-tests/status'].join('/'),
        auth:   { user: runner.options.username, pass: runner.options.key },
        json:   { 'js tests': [taskId] }
    };

    return new Promise(function (resolve, reject) {
        function checkResult () {
            runner._sendRequest(params)
                .then(function (body) {
                    var result = body['js tests'] && body['js tests'][0];

                    if (!body.completed) {
                        return wait(1000 * 2)
                            .then(checkResult);
                    }

                    resolve(result);
                })
                .catch(function (err) {
                    reject(err);
                })
        }

        checkResult();
    });
};

function wait (ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}