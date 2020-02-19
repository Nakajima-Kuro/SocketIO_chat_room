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
            if ($(this).find('span').text() != inVideoCall) {
                $(this).find('i').show();
            }

        });
    }
    else {
        var table = $("#group-call-member tr")
        table.each(function () {
            $(this).find('i').hide();
        });
    }
}

function groupCallPush(user) {
    if($("#group-call-" + user.id).find('span').text() != inVideoCall)
    {
        $("#group-call-" + user.id).find('i').toggle();
    }
    else{
        $("#group-call-join-name").text(user.id)
        $("#group-call-join-confirm").modal()
    }
}

function groupCallInit() {
    var table = $("#group-call-member tr")
    groupCallMember = new Array();
    table.each(function () {
        if ($(this).find('i').is(":visible")) {
            groupCallMember.push($(this).find('.user').text())
        }
    });
    $("#group-call-init").modal('hide')
    if ($('#call-window-group').is(':visible') == false) {
        if (groupCallMember.length > 0) {
            socket.emit("group_call_status", { status: 'in' })
            isBusy = true;
            groupCallMember.unshift(username)
            groupCall.peerList = [peer.id]
            socket.emit("group_call_request", { groupCallMember: groupCallMember, type: 'new' })
            navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
                .then(gotGroupLocalMediaStream).catch(handleLocalMediaStreamError)
            $("#call-window-group").modal();
        }
    }
    else {
        socket.emit("group_call_request", { groupCallMember: groupCallMember, type: 'add' })
    }
    table.each(function () {
        $(this).find('i').hide();
    });
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

socket.on('group_call_status', function (data) {
    if (data.status == 'in') {
        $("#group-call-" + data.username).find('span').text('')
    }
    else if (data.status == 'out') {
        $("#group-call-" + data.username).find('span').empty()
    }
})

function groupCallRespone(status) {
    if (status == 1) {
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
            .then(gotGroupLocalMediaStream).catch(handleLocalMediaStreamError)
            .then(function () {
                if (hasWebcam == true) {
                    if($('#group-call-init').is(':visible') == true){
                        $("#group-call-init").modal('hide')
                    }
                    socket.emit("group_call_status", { status: 'in' })
                    groupCall.fresh = false;
                    groupCall.peerList.push(peer.id);
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
    isBusy = false
    stopStreamedVideo(localGroupVideo);
    socket.emit("group_call_status", { status: 'out' })
});

$("#add-new-callee").click(function (event) {
    event.preventDefault();
    $("#group-call-init").modal()
});

// Video element where stream will be placed.
const localGroupVideo = document.querySelector('video#localGroupVideo');

// Handles success by adding the MediaStream to the video element.
function gotGroupLocalMediaStream(mediaStream) {
    hasWebcam = true;
    localStream = mediaStream;
    localGroupVideo.srcObject = mediaStream;
}