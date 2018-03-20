'use strict';

var video = document.getElementById("player");

if (!window.MediaSource) {
    alert('The MediaSource API is not available on this platform');
}

var mediaSource = new MediaSource();
var videoSourceBuffer = null;
var audioSourceBuffer = null;
var videoSegments = null;
var audioSegments = null;
var videoIdx = 0;
var audioIdx = 0;
var playing = false;
var normalSpeed = true;

video.src = window.URL.createObjectURL(mediaSource);
console.log('ready=' + video.readyState + ', currentTime=' + video.currentTime);

mediaSource.addEventListener('sourceopen', function() {

    // setup video
    videoSourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42000c"');
    videoSourceBuffer.addEventListener('updateend', function() {
        console.log('got video segment: ' + videoIdx);
        videoIdx++;
        if (videoIdx < videoSegments.length) {
            fetchVideoSegment();
        }
        else
        {
            play();
        }
    });

    //videoSourceBuffer.addEventListener('update', function() {console.log('videoSourceBuffer::update')});
    videoSourceBuffer.addEventListener('error', function() {console.log('videoSourceBuffer::error')});
    videoSourceBuffer.addEventListener('abort', function() {console.log('videoSourceBuffer::abort')});

    // setup audio
    audioSourceBuffer = mediaSource.addSourceBuffer('audio/mp4; codecs="mp4a.40.2"');
    audioSourceBuffer.addEventListener('updateend', function() {
        console.log('got audio segment: ' + audioIdx);
        audioIdx++;
        if (audioIdx < audioSegments.length) {
            fetchAudioSegment();
        }
        else
        {
            play();
        }
    });

    //audioSourceBuffer.addEventListener('update', function() {console.log('audioSourceBuffer::update')});
    audioSourceBuffer.addEventListener('error', function() {console.log('audioSourceBuffer::error')});
    audioSourceBuffer.addEventListener('abort', function() {console.log('audioSourceBuffer::abort')});
    

    fetchManifest()
});

mediaSource.addEventListener('sourceended', function() {console.log('mediaSource::sourceended')});
mediaSource.addEventListener('sourceclose', function() {console.log('mediaSource::sourceclose')});
mediaSource.addEventListener('error', function() {console.log('mediaSource::error')});
mediaSource.addEventListener('abort', function() {console.log('mediaSource::abort')});

function fetchManifest() {
    get('manifest.json', false, function(data) {
        var obj = JSON.parse(data);
        videoSegments = obj['video'];
        audioSegments = obj['audio'];
        fetchVideoSegment();
        fetchAudioSegment();
    });
}

function fetchVideoSegment() {
    get(videoSegments[videoIdx], true, function(segData) {
        videoSourceBuffer.appendBuffer(new Uint8Array(segData));
    })
}

function fetchAudioSegment() {
    get(audioSegments[audioIdx], true, function(segData) {
        audioSourceBuffer.appendBuffer(new Uint8Array(segData));
    })
}

// Get resource
function get(url, isArray, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    if (isArray) {
        xhr.responseType = 'arraybuffer';
    }
    xhr.send();

    xhr.onload = function() {
        if (xhr.status !== 200) {
            alert('Unexpected status code ' + xhr.status + ' for ' + url);
            return false;
        }
        callback(xhr.response);
    };
}

function play() {
    if (!playing)
    {
        console.log('play');
        console.log(video);
        playing = true;
        video.currentTime = video.buffered.start(0);
        let playPromise = video.play();

        // Print some player state
        setInterval(() => {
            /*
            console.log('ready=' + video.readyState +
                        ', currentTime=' + video.currentTime,
                        ', buffer=' + video.buffered.start(0) + '-' + video.buffered.end(0));
            */
            }, 1000);

        // Toggle speed
        document.getElementById('overlay').innerHTML = 'Normal speed';
        setInterval(() => {
            if (normalSpeed) {
                console.log('Double speed');
                document.getElementById('overlay').innerHTML = 'Double speed';
                video.playbackRate = 2.0;
            }
            else {
                console.log('Normal speed');
                document.getElementById('overlay').innerHTML = 'Normal speed';
                video.playbackRate = 1.0;
            }
            normalSpeed = !normalSpeed;
        }, 5000);

        return playPromise;
    }
}
