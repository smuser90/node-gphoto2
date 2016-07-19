var GPhoto2 = require('../build/Release/gphoto2');
var should = require('should');
var execFile = require('child_process').execFile;
var fs = require('fs');

var GPhoto = new GPhoto2.GPhoto2();
var camera = null;

var rssMemoryUsageInMB = function () {
    return (process.memoryUsage().rss / (1024 * 1024));
};


function getCamera(callback) {
    // List cameras / assign list item to variable to use below options
    console.log("Searching for cameras...");
    GPhoto.list(function(list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].model != 'Mass Storage Camera') {
                camera = list[i];
                console.log("camera:", camera);
                break;
            }
        }
        if (!camera) {
            console.log("No cameras found, exiting test");
            exit();
            return;
        }

        console.log('Found', camera.model);
        callback();
    });
}

var imageIndex = 0;
function processRawPath(path, info, callback) {
    imageIndex++;
    var dest = "/media/test/image" + imageIndex + info.substr(-4); // get extension
    console.log("Saving RAW image " + path + " to " + dest);
    execFile('/bin/cp', ['--no-target-directory', path, dest], {}, function(err, stdout, stderr) {
        fs.unlink(path);
    });

    callback(err, {
        file: info
    });
}

function capture(callback) {
    console.log("running camera.takePicture()");
    var captureOptions = {
        targetPath: '/tmp/tmpXXXXXX',
        keepOnCamera: false
    }
    camera.takePicture(captureOptions, function(err, photo, info) {
        console.log("running camera.takePicture() -> callback()");
        if (!err && photo) {
            console.log("file info:", info);
            console.log("Received photo", photo);
            processRawPath(photo, info, callback);
        } else {
            console.log("err", err);
        }
    });
}

function captureSequence(count, callback) {
    if(count > 0) {
        count--;
        capture(function() {
            process.nextTick(function(){captureSequence(count)});
        });
    } else {
        callback();
    }
}

describe('multiple calling gphoto list method', function () {
    it('should not increase memory usage that much', function (done) {
        this.timeout(20 * 1000);

        getCamera(function(){
            var initialMemory = rssMemoryUsageInMB();
            var count = 20;

            captureSequence(count, function () {
                var finalMemory = rssMemoryUsageInMB();
                var memoryIncrease = finalMemory - initialMemory;
                var memoryIncreasePerCall = memoryIncrease / count;
                console.log('Photos: ' + count + '; Total memory increase: ' + memoryIncrease + ' Mb; Memory increase per call: ' + memoryIncreasePerCall + ' Mb');
                memoryIncreasePerCall.should.be.below(1, 'each call should be increasing memory usage by max 1 Mb');
                done();
            });
            
        });

    });
});

