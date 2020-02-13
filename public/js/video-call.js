//convention status:
//0: Disconnected
//1: Connected
//2: Busy

var hasWebcam = false;
var isBusy = false;
var callerID = "";

const mediaStreamConstraints = {
  video: true,
  audio: true
};

const peer = new Peer({
  key: 'lwjd5qra8257b9'
});

function callInit(username) {
  if ($("#username").val() != "") {
    $('#calling-status').removeClass('text-danger text-success').addClass('text-info glow').text('Calling...')
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
      .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
      .then(function () {
        if (hasWebcam == true) {
          isBusy = true;
          socket.emit("request_peer_id", { username: username })
          $("#call-window").modal()
        }
      })
  }
  else {
    $("#call-no-name").modal();
  }
}

socket.on("get_peer_id", function (data) {
  if (isBusy == false) {
    callerID = data.socketID;
    $('#caller-id').text(data.socketID)
    $('#caller-name').text(data.username)
    $("#call-incomming").modal();
  }
  else {
    socket.emit("get_peer_id_respone", { peerID: peer.id, socketID: data.socketID, status: 2 })
  }
  // console.log("send peer id back to the caller");
})

function callRespone(status) {
  if (status == 1) {
    isBusy = true;
  }
  socket.emit("get_peer_id_respone", { peerID: peer.id, socketID: $('#caller-id').text(), status: status })
}

socket.on("request_peer_id_respone", function (data) {
  // console.log("got the peer id, let call");
  // console.log(data.peerID);
  if (data.status == 1) {
    $('#calling-status').removeClass('text-info text-danger glow').addClass('text-success').text('Connected')
    const call = peer.call(data.peerID, localStream);
    call.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream
    });
    call.on('close', function () {
      disconnectedNoti();
    })
    $('#end-call-button').click(function () {
      call.close();
    })
  }
  else if (data.status == 0) {
    $('#calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Disconnected')
    setTimeout(
      function () {
        $('#call-window').modal('hide');
      }, 1500);
  }
  else {
    busyNoti();
  }
})

socket.on("webcam_fail", function () {
  $('#calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Error')
  setTimeout(
    function () {
      $('#call-window').modal('hide');
    }, 1500);
})

peer.on('call', function (call) {
  $('#calling-status').removeClass('text-info text-danger glow').addClass('text-success').text('Connected')
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
    .then(function () {
      if (hasWebcam == true) {
        call.answer(localStream);
        call.on('stream', (remoteStream) => {
          remoteVideo.srcObject = remoteStream
        });
        $('#call-window').modal();
      }
      else {
        socket.emit("webcam_fail", { caller: callerID })
        isBusy = false
      }
    })
  call.on('close', function () {
    disconnectedNoti()
  })
  $('#end-call-button').click(function () {
    call.close()
  })
});

$('#call-window').on('hidden.bs.modal', function () {
  isBusy = false;
  stopStreamedVideo(localVideo);
});

function disconnectedNoti() {
  $('#calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Disconnected');
  setTimeout(
    function () {
      stopStreamedVideo(remoteVideo);
      $('#call-window').modal('hide');
      isBusy = false;
      // console.log("Disconnected");
    }, 1500);
}

function busyNoti() {
  $('#calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Busy')
  setTimeout(
    function () {
      $('#call-window').modal('hide');
      isBusy = false;
    }, 2000);
}

function stopStreamedVideo(videoElem) {
  if (videoElem != null) {
    let stream = videoElem.srcObject;
    let tracks = stream.getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    videoElem.srcObject = null;
  }
}
// Video element where stream will be placed.
const localVideo = document.querySelector('video#localVideo');
const remoteVideo = document.querySelector('video#remoteVideo');
let localStream;

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
  hasWebcam = true;
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
  console.log('navigator.getUserMedia error: ', error);
  alert("There is something wrong with you webcam\n" + error)
  hasWebcam = false;
}