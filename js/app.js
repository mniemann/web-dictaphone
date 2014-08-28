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
var clipList = document.getElementById("clip");


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
      //save new audio memo
      mediaRecorder.ondataavailable = function(e) {
        console.log("data available");
        //get name and label
        var d = new Date();
        var clipName = prompt('Enter a name for your audio clip');
        //get link to audio
        //var audioURL = window.URL.createObjectURL(e.data);
        //create new database record;
        var newAudioMemo = new AudioMemo();
        newAudioMemo.title = clipName;
        newAudioMemo.date = d
        newAudioMemo.audio = e.data;
        //save to database
        var objectStore = db.transaction(["vmemos"], "readwrite").objectStore("vmemos");
        var request = objectStore.add(newAudioMemo);
        request.onsuccess = function(event) {
          console.log("new memo stored");
          refreshMemoList();
        };
        request.onerror = function(event) {
          console.log("error storing new memo",event);
        };
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

function deleteClip(e) {
    var currentClip = e.target.parentNode;
    var currentLabel = currentClip.previousSibling;
    currentClip.parentNode.removeChild(currentClip);
    currentLabel.parentNode.removeChild(currentLabel);
    var memoId = parseInt(currentLabel.getAttribute("id"), 10);
    var objectStore = db.transaction(["vmemos"], "readwrite").objectStore("vmemos");
    request = objectStore.delete(memoId);
    request.onerror = function(event) {
      console.log("some error occured", event);
    };
    request.onsuccess = function(event) {
      console.log("memo deleted");
    };

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

function refreshMemoList() {
  if (!db) {
    console.log("Database is not ready yet");
    setTimeout(refreshMemoList, 1000);
    return;
  }
  console.log("Refreshing memo list");
  //clear old list contents
  while(clipList.hasChildNodes()) {
    clipList.removeChild(clipList.lastChild);
  }
  var objectStore = db.transaction("vmemos").objectStore("vmemos");
  objectStore.openCursor().onsuccess = function(event) {
    var cursor = event.target.result;
    if (cursor) {
      //get and format date for each record
      var clipName = cursor.value.title;
      var clipDate = cursor.value.date;
      clipDate = (clipDate.getMonth() + 1) + "/" + clipDate.getDate() + "/" + clipDate.getFullYear();
      var clipLabel = document.createTextNode(clipName + " - " + clipDate);
      //get audio blob
      var clipAudio = cursor.value.audio;
      console.log(clipAudio);
      var URL = window.URL;
      var audioURL = URL.createObjectURL(clipAudio);
      //create lists for display
      var clipListItem = document.createElement("dt");
      clipListItem.appendChild(clipLabel);
      clipListItem.addEventListener("click", toggleAudio);
      var clipListSubItem = document.createElement("dd");
      clipListSubItem.classList.add("hidden");
      //create audio element
      var audio = document.createElement('audio');
      audio.setAttribute('controls', '');
      audio.src = audioURL;
      //URL.revokeObjectURL(audioURL);
      //create delete button
      var deleteButton = document.createElement('button');
      deleteButton.classList.add("deleteButton");
      deleteButton.innerHTML = "Delete";
      deleteButton.addEventListener("click", deleteClip);

      clipListSubItem.appendChild(audio);
      clipListSubItem.appendChild(deleteButton);
      clipList.appendChild(clipListItem);
      clipList.appendChild(clipListSubItem);
      clipListItem.setAttribute("id", cursor.value.id);
      cursor.continue();
    }
    else {
      console.log("all items found");
    }
  }
}

//start app
window.onload = function () {
  refreshMemoList();
}
