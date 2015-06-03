var gulp = require('gulp'),
    gulpConnect = require('gulp-connect'),
    Promise = require('promise'),
    SauceTunnel = require('sauce-tunnel'),
    QUnitRunner = require('./lib/saucelab-qunit-runner');

var SAUCELAB_USERNAME = 'dikareva_github';
var SAUCELAB_PASSWORD = '43b7cb4b-6208-4718-aaaf-81060cb3448e';
var BROWSERS = [{
    browserName: "chrome",
    version: "43",
    platform: "Windows 7"
}];

var tunnelIdentifier = Math.floor((new Date()).getTime() / 1000 - 1230768000).toString();

var sauceTunnel = null;

gulp.task('open-connect', function () {
    gulpConnect.server({
        root: '',
        port: 1335
    });
});

gulp.task('sauce-start', function () {
    return new Promise(function (resolve, reject) {
        sauceTunnel = new SauceTunnel(SAUCELAB_USERNAME, SAUCELAB_PASSWORD, tunnelIdentifier, true);

        sauceTunnel.start(function (isCreated) {
            if (!isCreated)
                reject('Failed to create Sauce tunnel');
            else
                resolve('Connected to Sauce Labs');
        });
    });
});

gulp.task('run-tests', ['open-connect', 'sauce-start'], function (callback) {
    var runner = new QUnitRunner({
        username: SAUCELAB_USERNAME,
        key: SAUCELAB_PASSWORD,
        browsers: BROWSERS,
        tunnelIdentifier: tunnelIdentifier
    });

    runner.runTests(function (result) {
        console.log(JSON.stringify(result));
        callback();
    });
});

gulp.task('sauce-end', ['run-tests'], function () {
    return new Promise(function (resolve) {
        sauceTunnel.stop(resolve);
    })
});

gulp.task('close-connect', ['run-tests'], function () {
    gulpConnect.serverClose();

});

gulp.task('QUnit', ['close-connect', 'sauce-end']);