var GPhoto2 = require('../build/Release/gphoto2');
var gphoto2 = new GPhoto2.GPhoto2();
var os = require('os');

var i =  100;
var list = function () {
    gphoto2.list(function (cameras) {
        console.log(process.memoryUsage(), os.freemem());
        if (i--) {
            list();
        }
    });
};

list();