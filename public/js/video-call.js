//convention status:
//0: Disconnected
//1: Connected
//2: Busy

window.hasWebcam = false;
window.isBusy = false;
window.callerID = "";
var callType;//goi group hoac video hoac phone call
window.groupCall = new GroupVideoCall();
var callee
var inCall = false
//1: 1 - 1 call
//2: group call

var mediaStreamConstraints = {
  video: true,
  audio: true
};

const peer = new Peer({
  key: 'lwjd5qra8257b9'
});

peer.on('open', function (id) {
  socket.emit("init", { peerID: id })
});

function callInit(tempCallee) {
  mediaStreamConstraints.video = true;
  if (username != "" && username != 'Anonymous') {
    $('.calling-status').removeClass('text-danger text-success').addClass('text-info glow').text('Calling...')
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
      .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
      .then(function () {
        if (hasWebcam == true) {
          mutedToogle(localVideo)
          isBusy = true;
          socket.emit("request_peer_id", { username: tempCallee, type: 'video_call' })
          timerStop()
          $("#call-window").modal()
          callee = tempCallee
          callingSound.play()
        }
      })
  }
  else {
    $("#call-no-name").modal();
  }
}

function dialInit(tempCallee) {
  mediaStreamConstraints.video = false
  if (username != "" && username != 'Anonymous') {
    $('.calling-status').removeClass('text-danger text-success').addClass('text-info glow').text('Calling...')
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
      .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
      .then(function () {
        mutedToogle(localVideo)
        isBusy = true;
        socket.emit("request_peer_id", { username: tempCallee, type: 'phone_call' })
        $('#phone-caller-name').text(tempCallee)
        timerStop()
        $("#phonecall-window").modal()
        callee = tempCallee
        callingSound.play()
      })
  }
  else {
    $("#call-no-name").modal();
  }
}

$('.end-call-button').click(function () {
  if (inCall == false) {
    socket.emit('change_my_mind', { callee: callee })
  }
})

socket.on('change_my_mind', function (data) {
  $("#call-incomming").modal('hide');
  getCallRing.stop()
  callingSound.stop()
  setTimeout(function () {
    $("#call-window").modal('hide');
    $("#phonecall-window").modal('hide');
    stopStreamedVideo(remoteVideo)
  }, 3000)
  if (!$('#call-window').is(':visible') && !$('#phonecall-window').is(':visible')) {
    selfWarning('You just missed a call from <span class="text-info">' + data.username + '</span>')
  }
})

socket.on("get_peer_id", function (data) {
  if (isBusy == false) {
    callerID = data.socketID;
    $('#caller-id').text(data.socketID)
    $('#caller-name').text(data.username)
    if (data.type == 'phone_call') {
      $('#get-call-header').text('Phone Call')
    }
    else {
      $('#get-call-header').text('Video Call')
    }
    $("#call-incomming").modal();
    callType = data.type
    getCallRing.play()
  }
  else {
    socket.emit("get_peer_id_respone", { peerID: peer.id, socketID: data.socketID, status: 2 })
  }
  // console.log("send peer id back to the caller");
})

function callRespone(status) {
  getCallRing.stop();
  if (status == 1) {
    isBusy = true;
    $('#phone-caller-name').text($('#caller-name').text())
  }
  socket.emit("get_peer_id_respone", { peerID: peer.id, socketID: $('#caller-id').text(), status: status })
}

socket.on("request_peer_id_respone", function (data) {
  // console.log("got the peer id, let call");
  // console.log(data.peerID);
  if (data.status == 1) {
    $('.calling-status').removeClass('text-info text-danger glow').addClass('text-success').text('Connected')
    timerStart()
    const call = peer.call(data.peerID, localStream);
    call.on('stream', (remoteStream) => {
      if ($('#call-window').is(':visible') || $('#phonecall-window').is(':visible')) {
        mutedToogle(localVideo)
        inCall = true
        remoteVideo.srcObject = remoteStream
        callingSound.stop()
      }
      else {
        socket.emit('change_my_mind', { callee: callee })
      }
    });
    call.on('close', function () {
      disconnectedNoti();
    })
    $('.end-call-button').click(function () {
      call.close();
    })
  }
  else if (data.status == 0) {
    disconnectedNoti()
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
  $('.calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Error')
  setTimeout(
    function () {
      $('#call-window').modal('hide');
    }, 1500);
})

peer.on('call', function (call) {
  if (callType == 'video_call' || callType == 'phone_call') {
    if (callType == 'video_call') {
      mediaStreamConstraints.video = true
    }
    else {
      mediaStreamConstraints.video = false
    }
    $('.calling-status').removeClass('text-info text-danger glow').addClass('text-success').text('Connected')
    timerStart()
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
      .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
      .then(function () {
        if (hasWebcam == true || callType == 'phone_call') {
          call.answer(localStream);
          call.on('stream', (remoteStream) => {
            remoteVideo.srcObject = remoteStream
            inCall = true
          });
          if (callType == 'phone_call') {
            $('#phonecall-window').modal();
          }
          else if (callType == 'video_call') {
            $('#call-window').modal();
          }
        }
        else {
          socket.emit("webcam_fail", { caller: callerID })
          isBusy = false
        }
      })
    call.on('close', function () {
      disconnectedNoti()
    })
    $('.end-call-button').click(function () {
      call.close()
    })
  } else {
    // console.log("got group call");
    groupCall.fresh = false;
    call.answer(localStream);
    groupCall.addVideo(call.peer)
    const remoteVideo = document.getElementById(call.peer).getElementsByTagName('video')[0]
    call.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream//nhet them video moi vao html
      updateAvaCall()
    });
    call.on('close', function () {
      stopStreamedVideo(remoteVideo);
    })
    $('#end-group-call-button').click(function () {
      call.close()
    })
    $('#call-window-group').on('hidden.bs.modal', function () {
      call.close()
    });
  }
});

$('#call-window').on('hidden.bs.modal', function () {
  isBusy = false;
  inCall = false;
  stopStreamedVideo(localVideo);
  callingSound.stop()
  timerStop()
});

$('#phonecall-window').on('hidden.bs.modal', function () {
  isBusy = false;
  inCall = false;
  stopStreamedVideo(localVideo);
  callingSound.stop()
  timerStop()
});

function disconnectedNoti() {
  $('.calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Disconnected');
  callingSound.stop()
  hangupSound.play()
  try {
    var audioElem = localVideo
    if (audioElem != null) {
      let stream = audioElem.srcObject;
      if (stream != null) {
        stream.getAudioTracks()[0].enabled = false;
      }
    }
  }
  catch (e) {
    alert(e)
  }
  setTimeout(
    function () {
      stopStreamedVideo(remoteVideo);
      $('#call-window').modal('hide');
      $('#phonecall-window').modal('hide');
      isBusy = false;
      hangupSound.stop()
    }, 1500);
}

function busyNoti() {
  $('.calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Busy')
  setTimeout(
    function () {
      $('#call-window').modal('hide');
      $('#phonecall-window').modal('hide');
      isBusy = false;
    }, 2000);
}

function stopStreamedVideo(videoElem) {
  try {
    if (videoElem != null) {
      let stream = videoElem.srcObject;
      if (stream != null) {
        let tracks = stream.getTracks();

        tracks.forEach(function (track) {
          track.stop();
        });
      }
      videoElem.srcObject = null;
    }
  }
  catch (e) {
    alert(e)
  }
}

function mutedToogle(audioElem) {
  try {
    if (audioElem != null) {
      let stream = audioElem.srcObject;
      if (stream != null) {
        stream.getAudioTracks()[0].enabled = !(stream.getAudioTracks()[0].enabled);
      }
    }
  }
  catch (e) {
    alert(e)
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