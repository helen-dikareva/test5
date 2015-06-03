var Promise = require('promise');

var p1 = new Promise(function (resolve) {
    console.log('promise 1 started');
    setTimeout(function () {
        console.log('promise 1 finished');
        resolve('p1');
    }, 500);
});

function f5 () {
    return new Promise(function (resolve) {
        console.log('promise 5 started');

        setTimeout(function () {
            console.log('promise 5 finished');
            resolve('p5');
        }, 1000);
    });
}

var p3 = new Promise(function (resolve) {
    console.log('promise 3 started');
    setTimeout(function () {
        console.log('promise 3 finished');
        resolve('p3');
    }, 200);
});

Promise.all([f5(), p1, 'b', Promise.resolve('c'), p3])
    .then(function (res) {
        console.log(JSON.stringify(res));
    });