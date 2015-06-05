var gulp        = require('gulp'),
    gulpConnect = require('gulp-connect'),
    Promise     = require('promise'),
    SauceTunnel = require('sauce-tunnel'),
    QUnitRunner = require('./lib/saucelab-qunit-runner');

var SAUCE_LABS_USERNAME = process.env.SAUCELAB_USERNAME;
var SAUCE_LABS_PASSWORD = process.env.SAUCELAB_PASSWORD;

console.log('TRAVIS_BUILD_ID = ', process.env.TRAVIS_BUILD_ID);
console.log('TRAVIS_BUILD_NUMBER = ', process.env.TRAVIS_BUILD_NUMBER);
console.log('TRAVIS_COMMIT = ', process.env.TRAVIS_COMMIT);
console.log('TRAVIS_JOB_ID = ', process.env.TRAVIS_JOB_ID);
console.log('TRAVIS_JOB_NUMBER = ', process.env.TRAVIS_JOB_NUMBER);

var BROWSERS            = [
    {
        browserName: "chrome",
        platform:    "Windows 7"
    },
    {
        browserName: "firefox",
        platform:    "Windows 8"
    },
    {
        browserName: "firefox",
        platform:    "XP"
    }];

var tunnelIdentifier  = Math.floor((new Date()).getTime() / 1000 - 1230768000).toString();
var sauceTunnel       = null;
var sauceTunnelOpened = false;
var taskSucceed       = true;

gulp.task('open-connect', function () {
    gulpConnect.server({
        root: '',
        port: 1335
    });
});

gulp.task('sauce-start', function () {
    return new Promise(function (resolve, reject) {
        sauceTunnel = new SauceTunnel(SAUCE_LABS_USERNAME, SAUCE_LABS_PASSWORD, tunnelIdentifier, true);

        sauceTunnel.start(function (isCreated) {
            if (!isCreated)
                reject('Failed to create Sauce tunnel');
            else {
                sauceTunnelOpened = true;
                resolve('Connected to Sauce Labs');
            }
        });
    });
});

gulp.task('run-tests', ['open-connect', 'sauce-start'], function (callback) {
    var runner = new QUnitRunner({
        username:         SAUCE_LABS_USERNAME,
        key:              SAUCE_LABS_PASSWORD,
        browsers:         BROWSERS,
        tunnelIdentifier: tunnelIdentifier
    });

    runner.runTests(function (results) {
        var failedCount = false;

        console.log(JSON.stringify(results, null, 4));

        results.forEach(function (resultsByUrl) {
            resultsByUrl.forEach(function (platformResults) {
                if (platformResults.result.failed)
                    failedCount += platformResults.result.failed;
            });
        });

        taskSucceed = !failedCount;

        if (!taskSucceed)
            console.log(failedCount, 'test(s) are failed');
        callback();
    });
});

gulp.task('sauce-end', ['run-tests'], function (callback) {
    //TODO: close it in all cases
    sauceTunnelOpened = false;
    sauceTunnel.stop(callback);
});

gulp.task('close-connect', ['run-tests'], function () {
    gulpConnect.serverClose();

});

gulp.task('QUnit', ['run-tests', 'sauce-end', 'close-connect'], function () {
    if (!taskSucceed)
        process.exit(1);
});

gulp.on('err', function () {
    if (sauceTunnelOpened)
        sauceTunnel.stop(new Function());
});
