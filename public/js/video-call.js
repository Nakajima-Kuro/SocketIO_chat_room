'use strict';
// On this codelab, you will be streaming only video (video: true).
const mediaStreamConstraints = {
  video: true,
  audio: true
};

// Video element where stream will be placed.
const localVideo = document.querySelector('video#localVideo');

let localPeerConnection;
let remotePeerConnection;
let localStream;

$("#room-member").on("click", ".call", function () {
  // Initializes media stream.
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError)
    .then(createPeerConnection);
});

$('#call-window').on('hidden.bs.modal', function () {
  hangup();
});

function hangup() {
  console.log('Ending call');
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  localStream.getTracks().forEach(track => track.stop());
  localStream = null;
}

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
}

// Handles error by logging a message to the console with the error message.
function handleLocalMediaStreamError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function createPeerConnection() {
  localPeerConnection = new RTCPeerConnection(null);
  remotePeerConnection = new RTCPeerConnection(null);
  localStream.getTracks().forEach(track => localPeerConnection.addTrack(track, localStream));
  console.log('localPeerConnection creating offer');
  localPeerConnection.onnegotiationeeded = () => console.log('Negotiation needed - localPeerConnection');
  remotePeerConnection.onnegotiationeeded = () => console.log('Negotiation needed - remotePeerConnection');
  localPeerConnection.onicecandidate = e => {
    console.log('Candidate localPeerConnection');
    remotePeerConnection
      .addIceCandidate(e.candidate)
      .then(onAddIceCandidateSuccess, onAddIceCandidateError);
  };
  remotePeerConnection.onicecandidate = e => {
    console.log('Candidate remotePeerConnection');
    localPeerConnection
      .addIceCandidate(e.candidate)
      .then(onAddIceCandidateSuccess, onAddIceCandidateError);
  };
  remotePeerConnection.ontrack = e => {
    if (remoteVideo.srcObject !== e.streams[0]) {
      console.log('remotePeerConnection got stream');
      remoteVideo.srcObject = e.streams[0];
    }
  };
  localPeerConnection.createOffer().then(
    desc => {
      console.log('localPeerConnection offering');
      localPeerConnection.setLocalDescription(desc);
      remotePeerConnection.setRemoteDescription(desc);
      remotePeerConnection.createAnswer().then(
        desc2 => {
          console.log('remotePeerConnection answering');
          remotePeerConnection.setLocalDescription(desc2);
          localPeerConnection.setRemoteDescription(desc2);
        },
        err => console.log(err)
      );
    },
    err => console.log(err)
  );
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log(`Failed to add Ice Candidate: ${error.toString()}`);
}