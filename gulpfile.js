var gulp        = require('gulp'),
    gulpConnect = require('gulp-connect'),
    Promise     = require('promise'),
    SauceTunnel = require('sauce-tunnel'),
    QUnitRunner = require('./lib/saucelab-qunit-runner');

var SAUCELAB_USERNAME = 'dikareva_github';
var SAUCELAB_PASSWORD = '43b7cb4b-6208-4718-aaaf-81060cb3448e';
var BROWSERS          = [
    {
        browserName: "chrome",
        platform:    "Windows 7"
    },
    {
        browserName: "firefox",
        platform:    "Windows 8"
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
        sauceTunnel = new SauceTunnel(SAUCELAB_USERNAME, SAUCELAB_PASSWORD, tunnelIdentifier, true, ['-l', 'logs/saucelabs-log.txt']);

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
        username:         SAUCELAB_USERNAME,
        key:              SAUCELAB_PASSWORD,
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

gulp.task('QUnit', ['close-connect', 'sauce-end'], function (arg) {
    if (!taskSucceed)
        process.exit(1);
});

gulp.on('err', function () {
    if (sauceTunnelOpened)
        sauceTunnel.stop(function () {
            process.exit(1);
        });
    else
        setTimeout(function () {
            process.exit(1);
        });
});