'use strict';
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
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
    .then(socket.emit("request_peer_id", { username: username }))
}

socket.on("get_peer_id", function (data) {
  socket.emit("get_peer_id_respone", { peerID: peer.id, socketID: data.socketID })
  // console.log("send peer id back to the caller");
})

socket.on("request_peer_id_respone", function (data) {
  // console.log("got the peer id, let call");
  // console.log(data.peerID);
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
    .then(function () {
      const call = peer.call(data.peerID, localStream);
      call.on('stream', (remoteStream) => {
        remoteVideo.srcObject = remoteStream
      });
    })
})

peer.on('call', function (call) {
  // console.log("I got the call, let's answer!");
  $("#call-window").modal();
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
    .then(function () {
      call.answer(localStream);
      call.on('stream', (remoteStream) => {
        remoteVideo.srcObject = remoteStream
      });
    })
});

peer.on('disconnected', function(){
  $('#call-window').modal('hide');
})

// Video element where stream will be placed.
const localVideo = document.querySelector('video#localVideo');
const remoteVideo = document.querySelector('video#remoteVideo');
let localStream;

$('#call-window').on('hidden.bs.modal', function () {
  console.log('Ending call');
  peer.disconnect();
  localStream.getTracks().forEach(function(track) {
    track.stop();
  });
  localStream = null;
});

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
  console.log('navigator.getUserMedia error: ', error);
}