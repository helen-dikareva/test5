var log = [];
var testName;
QUnit.done = function (test_results) {
    var tests = log.map(function (details) {
        return {
            name: details.name,
            result: details.result,
            expected: details.expected,
            actual: details.actual,
            source: details.source
        }
    });
    test_results.tests = tests;

    // delaying results a bit cause in real-world
    // scenario you won't get them immediately
    //setTimeout(function () { window.global_test_results = test_results; }, 2000);
    window.global_test_results = test_results;
};
QUnit.testStart(function (testDetails) {
    QUnit.log = function (details) {
        if (!details.result) {
            details.name = testDetails.name;
            log.push(details);
        }
    }
});

test("hello test 2", function () {
    ok(1 == "1", "Passed!");
});


asyncTest('async test 2', function () {
    window.setTimeout(function () {
        ok(1 == "1", "Passed!");
        start();
    }, 500);
});
