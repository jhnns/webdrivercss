'use strict';

/**
 * if multiple screen width are given resize browser dimension
 */

var async = require('async'),
    takenScreenSizes = {};

module.exports = function(done) {

    var that = this;
    this.newScreenSize = {};

    async.waterfall([
        /**
         * get current browser resolution to change back to it
         * after all shots were taken (only if a screenWidth is set)
         */
        function(cb) {
            if(!that.self.defaultScreenDimension && that.screenWidth && that.screenWidth.length) {
                that.instance.windowHandleSize()
                    .then(function(res) {
                        that.self.defaultScreenDimension = res.value;
                        cb();
                    });
            } else {
                cb();
            }
        },
        /**
         * get current browser url to change it back after each viewport size change (if configured)
         */
        function(cb) {
            if (!that.retainUrl) {
                return cb();
            }

            if (!that.self.defaultUrl) {
                that.instance.url()
                    .then(function (res) {
                        that.self.defaultUrl = res.value;
                        cb();
                    })
                    .catch(cb);
            } else {
                cb();
            }
        },
        function(cb) {

            if (!that.screenWidth || that.screenWidth.length === 0) {

                /**
                 * if no screenWidth option was set just continue
                 */
                return cb();

            }

            that.newScreenSize.width = parseInt(that.screenWidth.shift(), 10);
            that.newScreenSize.height = parseInt(that.self.defaultScreenDimension.height, 10);

            that.self.takeScreenshot = false;
            if (!takenScreenSizes[that.pagename] || takenScreenSizes[that.pagename].indexOf(that.newScreenSize.width) < 0) {
                /**
                 * set flag to retake screenshot
                 */
                that.self.takeScreenshot = true;

                /**
                 * cache already taken screenshot / screenWidth combinations
                 */
                if (!takenScreenSizes[that.pagename]) {
                    takenScreenSizes[that.pagename] = [that.newScreenSize.width];
                } else {
                    takenScreenSizes[that.pagename].push(that.newScreenSize.width);
                }
            }

            /**
             * resize browser resolution
             */
            that.instance.call(function () {

                /**
                 * if shot will be taken in a specific screenWidth, rename file and append screen width
                 * value in filename
                 */
                that.baselinePath = that.baselinePath.replace(/\.(baseline|regression|diff)\.png/, '.' + that.newScreenSize.width + 'px.$1.png');
                that.regressionPath = that.regressionPath.replace(/\.(baseline|regression|diff)\.png/, '.' + that.newScreenSize.width + 'px.$1.png');
                that.diffPath = that.diffPath.replace(/\.(baseline|regression|diff)\.png/, '.' + that.newScreenSize.width + 'px.$1.png');
                that.screenshot = that.screenshot.replace(/\.png/, '.' + that.newScreenSize.width + 'px.png');
                that.filename = that.baselinePath;

                that.instance.setViewportSize({width: that.newScreenSize.width, height: that.newScreenSize.height})
                    .pause(that.vpChangePause)
                    .call(cb);

            });
        },
        /**
         * reset url to make sure the viewport change did not mess it up (e.g. because of scroll position based url)
         */
        function(cb) {
            console.log(cb);
            if (!that.retainUrl) {
                return cb();
            }

            if (that.self.defaultUrl) {
                that.instance.url(that.self.defaultUrl)
                    .then(function () {
                        cb();
                    })
                    .catch(cb);
            } else {
                cb();
            }
        }
    ], done);
};
