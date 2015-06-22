(function ($) {
    jQuery.fn.extend({
        html5_qrcode: function (qrcodeSuccess, qrcodeError, videoError) {
            'use strict';

            console.log($(this));
            window.currEl = $(this);
            var vidTag = '<video id="html5_qrcode_video" width="1" height="1" muted autoplay></video>';
            var canvasTag = '<canvas id="qr-canvas" style="display:none;"></canvas>';
            var doScan = true;

            this.append(vidTag);
            this.append(canvasTag);

            var size_set = false,
                video = document.querySelector('#html5_qrcode_video'),
                canvas = document.querySelector('#qr-canvas'),
                width = $('#reader-container').width(),
                height = 0,
                scan_timeout = 1000,
                localMediaStream = null;

            var scan = function () {
                if (localMediaStream && doScan) {
                    try {
                        if (!size_set) {
                            height = video.videoHeight / (video.videoWidth / width);
                            video.setAttribute('width', width);
                            video.setAttribute('height', height);
                            canvas.setAttribute('width', width);
                            canvas.setAttribute('height', height);
                            size_set = true;
                        }
                        canvas.getContext('2d').drawImage(video, 0, 0, width, height);
                    } catch (e) {
                        alert(e);
                        // Fix FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=879717
                        if (e.name == "NS_ERROR_NOT_AVAILABLE") {
                            setTimeout(scan, 0);
                        } else {
                            throw e;
                        }
                    }

                    try {
                        qrcode.decode();
                    } catch (e) {
                        qrcodeError(e);
                    }

                    setTimeout(scan, scan_timeout);

                } else {
                    if (doScan) {
                        setTimeout(scan, scan_timeout);
                    }
                }
            }; //end snapshot function

            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

            var videoSelect = document.querySelector("#videoSource");

            function gotSources(sourceInfos) {
//                sourceInfos = sourceInfos.reverse();
                for (var i = 0; i != sourceInfos.length; ++i) {
                    var sourceInfo = sourceInfos[i];
                    var option = document.createElement("option");
                    option.value = sourceInfo.id;
                    if (sourceInfo.kind === 'video') {
                        option.text = sourceInfo.label || 'Camera n°' + 1;
                        videoSelect.appendChild(option);
                    }
                }
            }

            // Got Sources only work on Chrome Right now, not on FF.
            if (typeof MediaStreamTrack !== 'undefined' &&
                typeof(MediaStreamTrack.getSources) != 'undefined') {
                var selectSourceTag = "<br/><select id='videoSource'></select>";
                $('md-toolbar').append(selectSourceTag);
                videoSelect = document.querySelector("#videoSource");
                $("#videoSource").change(function () {
                    start();
                });
                MediaStreamTrack.getSources(gotSources);
            }

            var successCallback = function (stream) {
                localMediaStream = stream;
                if (navigator.mozGetUserMedia) {
                    video.mozSrcObject = stream;
                } else {
                    window.stream = stream; // make stream available to console
                    video.src = window.URL.createObjectURL(stream);
                }
                video.play();

                setTimeout(scan, scan_timeout);
            };

            function start(source) {
                if (!!window.stream) {
                    video.src = null;
                    window.stream.stop();
                }
                // Call the getUserMedia method with our callback functions
                if (navigator.getUserMedia) {
                    constraints = { video: true, audio: false };
                    if (videoSelect != null) {
                        var videoSource = videoSelect.value;
                        var constraints = {
                            video: {
                                optional: [
                                    {sourceId: videoSource}
                                ]
                            },
                            audio: false
                        };
                    }
                    navigator.getUserMedia(constraints, successCallback, videoError);
                } else {
                    console.log('Native web camera streaming (getUserMedia) not supported in this browser.');
                }

                qrcode.callback = qrcodeSuccess;
            }

            setTimeout(function () {
                start();
            }, 1500);

            $.fn.qrcode_stop = function() {
                if (!!window.stream) {
                    video.src = null;
                    window.stream.stop();
                }
                doScan = false;
            }
        }, // end of html5_qrcode

        html5_qrcode_stop: function () {
            return this.each(function () {
                //stop the stream and cancel timeouts
                $(this).data('stream').stop();
                clearTimeout($(this).data('timeout'));
            });
        }
    });
})(jQuery);