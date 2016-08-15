(function($) {
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    $.EnumCameraOptions = function(gotSources)
    {
        if (typeof MediaStreamTrack === 'undefined' ||
            typeof MediaStreamTrack.getSources === 'undefined') {
            throw 'This browser does not support MediaStreamTrack.\n\nTry Chrome.';
        } else {
            MediaStreamTrack.getSources(function(infos){
                gotSources(infos
                    .filter(function(info){return info.kind == 'video';})
                    .map(function(info, index){
                        return {id: info.id, name: info.label || 'camera ' + index};
                    })
                );
            });
        }
    };

    jQuery.fn.extend({
        html5_qrcode_option: function(option) {
            return this.each(function() {
                var currentElem = $(this);
                if(!$.hasData(this))
                    $.data(this, 'start_status', false);
                $.data(this, 'video_id', option.id);
            });
        },
        html5_qrcode: function(qrcodeSuccess, qrcodeError, videoError) {
            return this.each(function() {
                if($.hasData(this) && $.data(this, 'start_status'))
                {
                    throw 'html5_qrcode Already Start';
                }
                else
                {
                    // First Start
                    if(!$.hasData(this))
                    {
                        $.data(this, 'start_status', true);
                        $.data(this, 'video_id', null); // default ''
                    }

                    var currentElem = $(this);

                    var height = currentElem.height();
                    var width = currentElem.width();

                    if (height == null) {
                        height = 250;
                    }

                    if (width == null) {
                        width = 300;
                    }

                    var vidElem = $('<video width="' + width + 'px" height="' + height + 'px"></video>').appendTo(currentElem);
                    var canvasElem = $('<canvas id="qr-canvas" width="' + (width - 2) + 'px" height="' + (height - 2) + 'px" style="display:none;"></canvas>').appendTo(currentElem);

                    var video = vidElem[0];
                    var canvas = canvasElem[0];
                    var context = canvas.getContext('2d');
                    var localMediaStream;

                    var scan = function() {
                        if (localMediaStream) {
                            context.drawImage(video, 0, 0, 307, 250);

                            try {
                                qrcode.decode();
                            } catch (e) {
                                qrcodeError(e, localMediaStream);
                            }

                            $.data(currentElem[0], "timeout", setTimeout(scan, 500));

                        } else {
                            $.data(currentElem[0], "timeout", setTimeout(scan, 500));
                        }
                    };//end snapshot function

                    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

                    var successCallback = function(stream) {
                        video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
                        localMediaStream = stream;
                        $.data(currentElem[0], "stream", stream);

                        video.play();
                        $.data(currentElem[0], "timeout", setTimeout(scan, 1000));
                    };

                    // Call the getUserMedia method with our callback functions
                    if (navigator.getUserMedia) {
                        var config = $.data(this, 'video_id') == null?{video: true}:
                            {video: {optional: [{sourceId: $.data(this, 'video_id')}]}};
                        navigator.getUserMedia(config, successCallback, function(error) {
                            videoError(error, localMediaStream);
                        });
                    } else {
                        console.log('Native web camera streaming (getUserMedia) not supported in this browser.');
                        // Display a friendly "sorry" message to the user
                    }

                    qrcode.callback = function (result) {
                        qrcodeSuccess(result, localMediaStream);
                    };
                }
            }); // end of html5_qrcode
        },
        html5_qrcode_stop: function() {
            return this.each(function() {
                //stop the stream and cancel timeouts
                $(this).data('stream').getVideoTracks().forEach(function(videoTrack) {
                    videoTrack.stop();
                });

                clearTimeout($(this).data('timeout'));
            });
        }
    });
})(jQuery);
