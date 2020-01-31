const mediaStreamConstraints = {
  video: true,
  audio: true
};

const peer = new Peer({
  key: 'lwjd5qra8257b9'
});

peer.on('open', function () {
  socket.emit("peerID", { peerID: peer.id })
  // console.log(peer.id);
});

function callInit(username) {
  $('#calling-status').removeClass('text-danger text-success').addClass('text-info glow').text('Calling...')
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
    .then(socket.emit("request_peer_id", { username: username }))
}

socket.on("get_peer_id", function (data) {
  $('#caller-id').text(data.socketID)
  $('#caller-name').text(data.username)
  $("#call-incomming").modal();
  // console.log("send peer id back to the caller");
})

function callRespone(status) {
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
  else {
    $('#calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Disconnected')
    setTimeout(
      function () {
        $('#call-window').modal('hide');
      }, 3000);
  }
})

peer.on('call', function (call) {
  $('#calling-status').removeClass('text-info text-danger glow').addClass('text-success').text('Connected')
  $('#call-window').modal();
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
    .then(function () {
      call.answer(localStream);
      call.on('stream', (remoteStream) => {
        remoteVideo.srcObject = remoteStream
      });
    })
  call.on('close', function () {
    disconnectedNoti()
  })
  $('#end-call-button').click(function () {
    call.close()
  })
});

$('#call-window').on('hidden.bs.modal', function () {
  stopStreamedVideo(localVideo);
});

function disconnectedNoti() {
  $('#calling-status').removeClass('text-info text-success glow').addClass('text-danger').text('Disconnected')
  setTimeout(
    function () {
      stopStreamedVideo(remoteVideo);
      $('#call-window').modal('hide');
    }, 3000);
}

function stopStreamedVideo(videoElem) {
  let stream = videoElem.srcObject;
  let tracks = stream.getTracks();

  tracks.forEach(function (track) {
    track.stop();
  });

  videoElem.srcObject = null;
}
// Video element where stream will be placed.
const localVideo = document.querySelector('video#localVideo');
const remoteVideo = document.querySelector('video#remoteVideo');
let localStream;

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
  console.log('navigator.getUserMedia error: ', error);
}