var groupCallMember = [];

function groupCallHit() {
    if (username == "Anonymous" || username == "") {
        $("#call-no-name").modal()
    }
    else {
        $("#group-call-init").modal()
    }
}

function groupSelectAll() {
    if (document.getElementById("group-check-all").checked == true) {
        var table = $("#group-call-member tr")
        table.each(function () {
            $(this).find('i').show();
        });
    }
    else{
        var table = $("#group-call-member tr")
        table.each(function () {
            $(this).find('i').hide();
        });
    }
}

function groupCallPush(user) {
    $("#group-call-" + user.id).find('i').toggle();
}

function groupCallInit() {
    groupCallMember = new Array();
    var table = $("#group-call-member tr")
    table.each(function () {
        if ($(this).find('i').is(":visible")) {
            groupCallMember.push($(this).find('.user').text())
        }
    });
    if (groupCallMember.length > 0) {
        groupCallMember.unshift(username)
        groupCall.peerList = [peer.id]
        socket.emit("group_call_request", { groupCallMember: groupCallMember })
        $("#group-call-member").find('i').hide();
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
            .then(gotGroupLocalMediaStream).catch(handleLocalMediaStreamError)
        $("#call-window-group").modal();
    }
}

socket.on("group_call_request", function (data) {
    if (isBusy == false) {
        $('#group-caller-name').text(data.caller)
        $("#group-call-incomming").modal();
    }
})

socket.on("group_call_online_update", function (data) {
    // console.log(data.onlineList);
    groupCall.peerList = data.onlineList;
})

function groupCallRespone(status) {
    if (status == 1) {
        groupCall.fresh = false;
        groupCall.peerList.push(peer.id);
        socket.emit("group_call_online_update", { onlineList: groupCall.peerList })
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
            .then(gotGroupLocalMediaStream).catch(handleLocalMediaStreamError)
            .then(function () {
                if (hasWebcam == true) {
                    isBusy = true;
                    $("#call-window-group").modal();
                    for (let i = 0; i < groupCall.peerList.length; i++) {
                        if (groupCall.peerList[i] != peer.id) {
                            const call = peer.call(groupCall.peerList[i], localStream)
                            groupCall.addVideo(call.peer)
                            call.on('stream', (remoteStream) => {
                                const remoteVideo = document.getElementById(call.peer).getElementsByTagName('video')[0]
                                remoteVideo.srcObject = remoteStream
                            });
                            call.on('close', function () {
                                stopStreamedVideo(remoteVideo);
                                groupCall.deleteVideo(call.peer)
                            })
                            $('#end-group-call-button').click(function () {
                                call.close();
                            })
                        }
                    }
                }
            })

    }
    else {
        isBusy = false;
    }
}

$('#call-window-group').on('hidden.bs.modal', function () {
    groupCall = new GroupVideoCall();
});

function AddCallee(){
    $("#group-call-init").modal('show')
}

function stopGroupCall() {
    isBusy = false;
    stopStreamedVideo(localGroupVideo);
}

// Video element where stream will be placed.
const localGroupVideo = document.querySelector('video#localGroupVideo');

// Handles success by adding the MediaStream to the video element.
function gotGroupLocalMediaStream(mediaStream) {
    hasWebcam = true;
    localStream = mediaStream;
    localGroupVideo.srcObject = mediaStream;
}