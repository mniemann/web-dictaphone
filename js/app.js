// fork getUserMedia for multiple browser versions, for the future
// when more browsers support MediaRecorder

navigator.getUserMedia = (navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

// set up basic variables for app

var record = document.getElementById('record');
var stop = document.getElementById('stop');
var soundClips = document.getElementById('sound-clips');
var canvas = document.getElementById('visualizer');


// visualiser setup - create web audio api context and canvas

var audioCtx = new AudioContext();
var canvasCtx = canvas.getContext("2d");
var recFlag = 0;
//main block for doing the audio recording

if (navigator.getUserMedia) {
  console.log('getUserMedia supported.');
  navigator.getUserMedia (
    // constraints - only audio needed for this app
    {
      audio: true
    },

    // Success callback
    function(stream) {
      var mediaRecorder = new MediaRecorder(stream);

      visualize(stream);

      record.onclick = function() {
        if (recFlag == 0) {
          recFlag = 1;
          record.style.backgroundImage = "url('icons/buttonon.png')";
          mediaRecorder.start();
          console.log(mediaRecorder.state);
          console.log("recorder started");
        }
        else if (recFlag = 1) {
          recFlag = 0;
          record.style.backgroundImage = "url('icons/buttonoff.png')";
          mediaRecorder.stop();
          console.log(mediaRecorder.state);
          console.log("recorder stopped");
        }
      }
      mediaRecorder.ondataavailable = function(e) {
        console.log("data available");
        var d = new Date();
        var clipDate = (d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear();

        var clipName = document.createTextNode(prompt('Enter a name for your sound clip') + " " + clipDate);
        var clipList = document.getElementById("clip");

        var clipListItem = document.createElement("dt");
        clipListItem.appendChild(clipName);

        clipListItem.addEventListener("click", toggleAudio);

        var clipListSubItem = document.createElement("dd");
        clipListSubItem.classList.add("hidden");
        var audio = document.createElement('audio');
        var deleteButton = document.createElement('button');
        deleteButton.classList.add("deleteButton");

        audio.setAttribute('controls', '');
        deleteButton.innerHTML = "Delete";

//        var clipLabel = document.createTextNode(clipName);

        clipListSubItem.appendChild(audio);
        clipListSubItem.appendChild(deleteButton);
        clipList.appendChild(clipListItem);
        clipList.appendChild(clipListSubItem);


        var audioURL = window.URL.createObjectURL(e.data);
        audio.src = audioURL;

        deleteButton.onclick = function(e) {
          var currentClip = e.target.parentNode;
          var currentLabel = currentClip.previousSibling;
          currentClip.parentNode.removeChild(currentClip);
          currentLabel.parentNode.removeChild(currentLabel);
        }
      }
    },

    // Error callback
    function(err) {
      console.log('The following gUM error occured: ' + err);
    }
  );
}
else {
  console.log('getUserMedia not supported on your browser!');
}

function toggleAudio(event) {
  if (event.target.nextSibling.classList.contains("hidden")) {
    event.target.nextSibling.classList.remove("hidden");
  }
  else {
    event.target.nextSibling.classList.add("hidden");
  }

}
function visualize(stream) {
  var source = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  WIDTH = canvas.width
  HEIGHT = canvas.height;

  draw()

  function draw() {

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;


    for(var i = 0; i < bufferLength; i++) {

      var v = dataArray[i] / 128.0;
      var y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}
