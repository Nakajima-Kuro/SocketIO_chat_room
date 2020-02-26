var groupCallMember = new Queue();
var groupTimeOut = 3000
const maxCall = 5//so nguoi max co the goi
var avaCall = maxCall;//so nguoi thuc te con lai de goi (trong TH them nguoi khi dang goi => so nguoi co the them < so nguoi max)

function groupCallHit() {
    if (username == "Anonymous" || username == "") {
        $("#call-no-name").modal()
    }
    else {
        avaCall = maxCall;//goi duoc max cho 5 nguoi
        groupCallMember = new Queue()
        $("#group-call-init").modal()
    }
}

function groupSelectAll() {
    if (document.getElementById("group-check-all").checked == true) {
        var table = $("#group-call-member tr")
        table.each(function () {
            if ($(this).find('span').text() != inVideoCall) {
                if (groupCallMember.size() < avaCall) {
                    $(this).find('i').show();
                    groupCallMember.push($(this).find('.user').text())
                }
            }
        });
    }
    else {
        var table = $("#group-call-member tr")
        table.each(function () {
            $(this).find('i').hide();
        });
        groupCallMember = new Queue()
    }
}

function groupCallPush(user) {
    userDom = $("#group-call-" + user);
    if (userDom.find('span').text() != inVideoCall) {
        if (userDom.find('i').is(':visible') == false) {//neu chua duoc tick => show
            console.log('show');
            if (groupCallMember.size() >= avaCall) {//trong TH chon qua so nguoi gioi han => pop nguoi cuoi cung trong queue
                deleteName = groupCallMember.pop();
                $("#group-call-" + deleteName).find('i').hide();
            }
            groupCallMember.push(userDom.find('.user').text())
            userDom.find('i').show();
        }
        else {//neu da duoc tick => hide
            console.log('hide');
            groupCallMember.remove(userDom.find('.user').text())
            userDom.find('i').hide();
        }
    }
    else if ($('#call-window-group').is(':visible') == false) {//neu dang ko o trong video call => tham gia cuoc goi do luon
        $("#group-call-join-name").text(user)
        $("#group-call-join-confirm").modal()
    }
}

function groupCallInit() {
    var table = $("#group-call-member tr")
    $("#group-call-init").modal('hide')
    if ($('#call-window-group').is(':visible') == false) {//goi lan dau
        if (groupCallMember.size() > 0) {//co nguoi de goi trong danh sach goi
            socket.emit("group_call_status", { status: 'join' })
            isBusy = true;
            groupCallMember.queue.unshift(username)
            groupCall.peerList = [peer.id]
            navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
                .then(gotGroupLocalMediaStream).catch(handleLocalMediaStreamError)
                .then(function () {
                    if (hasWebcam == true) {
                        $("#call-window-group").modal();
                        socket.emit("group_call_request", { groupCallMember: groupCallMember.queue, type: 'new' })
                    }
                })
        }
    }
    else {//add them nguoi vao video call
        socket.emit("group_call_request", { groupCallMember: groupCallMember.queue, type: 'add' })
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

socket.on('group_call_status', function (data) {
    if (data.type == 'join') {
        $("#group-calling-status").empty().append('<span class="text-info">' + data.username + '</span> has joined')
        $("#group-call-" + data.username).find('span').text(inVideoCall)
        groupTimeOut = 3000
    }
    else if (data.type == 'left') {
        $("#group-calling-status").empty().append('<span class="text-info">' + data.username + '</span> has left')
        $("#group-call-" + data.username).find('span').empty()
        groupTimeOut = 3000
    }
    setTimeout(function () {
        $("#group-calling-status").empty();
    }, groupTimeOut);
})

function groupCallRespone(status) {
    if (status == 1) {
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
            .then(gotGroupLocalMediaStream).catch(handleLocalMediaStreamError)
            .then(function () {
                if (hasWebcam == true) {
                    if ($('#group-call-init').is(':visible') == true) {
                        $("#group-call-init").modal('hide')
                    }
                    socket.emit("group_call_status", { status: 'join' })
                    groupCall.fresh = false;
                    isBusy = true;
                    $("#call-window-group").modal();
                    for (let i = 0; i < groupCall.peerList.length; i++) {
                        if (groupCall.peerList[i] != peer.id) {
                            const call = peer.call(groupCall.peerList[i], localStream)
                            groupCall.addVideo(call.peer)
                            call.on('stream', (remoteStream) => {
                                const remoteVideo = document.getElementById(call.peer).getElementsByTagName('video')[0]
                                remoteVideo.srcObject = remoteStream
                                updateAvaCall()
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
    socket.emit("group_call_status", { status: 'left' })
});

$("#add-new-callee").click(function (event) {
    updateAvaCall();
    event.preventDefault();
    $("#group-call-init").modal()
});

function updateAvaCall() {
    avaCall = maxCall - $("#group-call-body video").length + 1
}

// Video element where stream will be placed.
const localGroupVideo = document.querySelector('video#localGroupVideo');

// Handles success by adding the MediaStream to the video element.
function gotGroupLocalMediaStream(mediaStream) {
    hasWebcam = true;
    localStream = mediaStream;
    localGroupVideo.srcObject = mediaStream;
}