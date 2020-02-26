class GroupVideoCall {
    constructor(peerList) {
        this.peerList = peerList
        this.videoNum = 1;
        this.fresh = true;
    }
    deleteVideo(peer) {
        var index = this.peerList.indexOf(peer);
        if ($('#group-call-row1').find('#' + peer).length == 1) {
            $("#" + peer).remove();
            $("#group-call-row1").append($("#group-call-row2 div")[0])
        }
        else{
            $("#" + peer).remove();
        }
        this.videoNum -= 1;
        if (this.videoNum == 1 && this.fresh == false) {
            isBusy = false;
            $("#call-window-group").modal('hide');
        }
        this.peerList.splice(index, 1)
    }
    addVideo(peer) {
        if (!$("#" + peer).length) {//neu chua ton tai video voi peerID nay
            this.videoNum += 1
            if (this.videoNum < 4)
                $("#group-call-row1").append('<div class="col" id="' + peer + '">' +
                    '<video class="col px-0" autoplay playsinline style="width: 100%;"></video>' +
                    '</div>')
            else if (this.videoNum == 4)
                $("#group-call-row2").append('<div class="col-4" id="' + peer + '">' +
                    '<video class="col px-0" autoplay playsinline style="width: 100%;"></video>' +
                    '</div>')
            else
                $("#group-call-row2").append('<div class="col-4" id="' + peer + '">' +
                    '<video class="col px-0" autoplay playsinline style="width: 100%;"></video>' +
                    '</div>')
        }
    }
}

var socket = io();
var username = "Anonymous";
var timeout = undefined;
var existRoom = new Array();
var roomCheck = false;
var room = "Public";
var roomMember = new Array();
var inVideoCall = '(In video call)'
var firstName = true;

var URLexpression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
var urlRegex = new RegExp(URLexpression);

socket.on('init', function (data) {
    switch ($.cookie('theme')) {
        case 'dark': {
            lightToDark();
            break;
        }
        default: {
            $.cookie("theme", "light", { expires: 7 });
            break;
        }
    }
    if ($.cookie('username') != null) {
        $("#username").val($.cookie('username'));
        $("#changename").click()
    }
    data.messageList.forEach(function (data) {
        pushMessage(data.username, data.message)
    })
    $(".loader-wrapper").fadeOut('slow');
    setTimeout(function () {
        // un-lock scroll position
        var html = jQuery('html');
        var scrollPosition = html.data('scroll-position');
        html.css('overflow', html.data('previous-overflow'));
    }, 700)
})

//client nhận dữ liệu từ server
socket.on("server_send", function (data) {
    var id = data.username + "-is-typing";
    lastChat = false;
    if (data.type == 1) {
        pushMessage(data.username, data.message)
        messageNoti.play()
    }
    else if (data.type == 2) {
        var newrow = '<tr class="chat-line"><td class="text-success align-middle pl-3">' + data.message + "</td></tr>"
        if (!$(".is-typing").length)
            $("#chat-content").append(newrow);
        else {
            $(".is-typing").first().before(newrow);
        }
    }
    else if (data.type == 3 && !$("#" + id).length) {
        $("#chat-content").append('<tr class="is-typing chat-line" id = "' + id + '"><td class="align-middle pl-3">' + data.message + "</td></tr>");
    }
    else if (data.type == 4) {
        newrow = '<tr class="chat-line"><td class="align-middle text-warning pl-3">' + data.message + "</td></tr>"
        if (!$(".is-typing").length)
            $("#chat-content").append(newrow);
        else {
            $(".is-typing").first().before(newrow);
        }
    }
    $("#chat-card").scrollTop($("#chat-table").height());
});
socket.on("group_update", function (data) {
    roomMember = data.group;
    groupCall.peerList = data.onlinePeer
    $("#member-table").find('tr').remove();
    $("#group-call-member").find('tr').remove();
    var i = 1;
    data.group.forEach(function (member) {
        if (member != username && member != "Anonymous") {
            if (data.onlineName.indexOf(member) == -1) {
                $("#group-call-member").append('<tr class="cursor-pointer" id="group-call-' + member + '" onclick="groupCallPush(\'' + member + '\')">' +
                    '<td width="15%" class="text-info highlight-0">' + i + '</td>' +
                    '<td class="text-info align-middle user highlight-0" width="70%">' + member +
                    '<span class="text-success ml-2 highlight-0"></span>' +
                    '</td><td><i class="fa fa-check text-info" aria-hidden="true" style="display: none;" width="15%"></i></td></tr>');
            }
            else {
                $("#group-call-member").append('<tr class="cursor-pointer" id="group-call-' + member + '" onclick="groupCallPush(\'' + member + '\')">' +
                    '<td width="15%" class="text-info highlight-0">' + i + '</td>' +
                    '<td class="text-info align-middle user highlight-0" width="70%">' + member +
                    '<span class="text-success ml-2 highlight-0">' + inVideoCall + '</span>' +
                    '</td><td><i class="fa fa-check text-info" aria-hidden="true" style="display: none;" width="15%"></i></td></tr>');
            }
            i++;
        }
    })
    if (room != "Public" && data.admin.name == username) {
        data.group.forEach(function (member) {
            if (member == username || member == "Anonymous") {
                $("#room-member").prepend('<tr style="height: 3.2rem;">' +
                    '<td class="text-info align-middle cursor-default highlight-0" style="max-width: 190px;">' + member +
                    '</td><td style="width: 45px;"></td></tr>');
            }
            else {
                $("#room-member").append('<tr style="height: 3.2rem;">' +
                    '<td class="text-info align-middle cursor-default highlight-0" style="max-width: 190px;">' + member +
                    '</td><td style="width: 45px;" class="align-middle">' +
                    '<div class="btn-group" role="group">' +
                    '<button type="button" id="' + member + '" onclick="dialInit(this.id)" class="btn btn-sm btn-outline-info call"><i class="fa fa-phone" aria-hidden="true"></i></button>' +
                    '<button type="button" id="' + member + '" onclick="callInit(this.id)" class="btn btn-sm btn-outline-info call"><i class="fa fa-video-camera" aria-hidden="true"></i></button>' +
                    '<button type="button" id="' + member + '" onclick="kickInit(this.id)" class="btn btn-sm btn-outline-danger"><i class="fa fa-times" aria-hidden="true"></i></button>' +
                    '</div></td></tr>');
            }
        })
    }
    else {
        data.group.forEach(function (member) {
            if (member == username || member == "Anonymous") {
                $("#room-member").prepend('<tr style="height: 3.2rem;">' +
                    '<td class="text-info align-middle cursor-default highlight-0" style="max-width: 190px;">' + member +
                    '</td><td style="width: 45px;"></td></tr>');
            }
            else {
                $("#room-member").append('<tr style="height: 3.2rem;">' +
                    '<td class="text-info align-middle cursor-default highlight-0" style="max-width: 190px;">' + member +
                    '</td><td style="width: 45px;" class="align-middle">' +
                    '<div class="btn-group" role="group">' +
                    '<button type="button" id="' + member + '" onclick="dialInit(this.id)" class="btn btn-sm btn-outline-info call"><i class="fa fa-phone" aria-hidden="true"></i></button>' +
                    '<button type="button" id="' + member + '" onclick="callInit(this.id)" class="btn btn-sm btn-outline-info call"><i class="fa fa-video-camera" aria-hidden="true"></i></button>' +
                    '</div></td></tr>');
            }
        })
    }
    var numberOfPeople = data.group.length;
    $("#people-number").empty().append(numberOfPeople);
});
socket.on("reset_chat", function () {
    $("#chat-content").empty()
});
socket.on("no_longer_typing", function (data) {
    var id = "#" + data.username + "-is-typing"
    $(id).remove();
})

//Room Update
socket.on("room_update", function (data) {
    existRoom = data.roomList;
    $("#room-list").empty();
    if ($.cookie('theme') == 'light') {
        for (let i = 0; i < data.roomList.length; i++) {
            $('#room-list').append('<tr class="cursor-pointer" onclick="joinRoomInit(\'' + data.roomList[i].roomName + '\')"><th class="theme-headline highlight-0" scope="row" width="20%">'
                + (i + 1) + '</th><td class="theme-text-light highlight-0" width="55%">' + data.roomList[i].roomName + '</td><td class="theme-text-light highlight-0" width="25%">' + data.roomList[i].roomPopulation + '</td></tr>')
        }
    }
    else if ($.cookie('theme') == 'dark') {
        for (let i = 0; i < data.roomList.length; i++) {
            $('#room-list').append('<tr class="cursor-pointer" onclick="joinRoomInit(\'' + data.roomList[i].roomName + '\')"><th class="theme-headline text-info highlight-0" scope="row" width="20%">'
                + (i + 1) + '</th><td class="theme-text-dark highlight-0" width="55%">' + data.roomList[i].roomName + '</td><td class="theme-text-dark highlight-0" width="25%">' + data.roomList[i].roomPopulation + '</td></tr>')
        }
    }
})
socket.on("join_respond", function (data) {
    if (data.status == 0)//sai mk
    {
        $("#join-password-wrong").show();
        $("#join-spinner").hide();
    }
    else if (data.status == 2)//trung ten
    {
        $("#join-name-taken").show();
        $("#join-spinner").hide();
    }
    else if (data.status == 1) {
        if (room != $("#join-room-id").val()) {//vao room khac
            $("#chat-content tr").remove()
            if ($("#join-room-id").val() != "") {
                room = $("#join-room-id").val();
            }
            else {
                room = 'Public'
            }
            password = $("#join-room-password").val();
            document.getElementById('room-iddisplay').innerHTML = room;
            data.messageList.forEach(function (data) {
                pushMessage(data.username, data.message)
            })
        }
        roomCheck = true
        $("#join-room-password").val("")
        $("#join-modal").modal('hide')
        $("#room-modal").modal('hide')
        socket.emit("room_update")
    }
})
socket.on("kick_user", function (data) {
    document.getElementById("kicker").innerHTML = data.kicker
    $("#join-room-id").val("Public")
    $("#kicked-modal").modal()
    username = 'Anonymous';
    socket.emit("reset_username")
    $("#username").val($.cookie('username'));
    socket.emit("join", { room: "Public", password: "", type: 0 });
    setTimeout(
        function () {
            var newrow = '<tr class="chat-line"><td class="text-success align-middle pl-3">Your name has been changed back to "Anonymous" by server</td></tr>'
            $("#chat-content").append(newrow);
        }, 1000);
    setTimeout(
        function () {
            $("#kicked-modal").modal('hide');
        }, 5000);
})
socket.on('change_name_respone', function (data) {
    if (data.status == 'good') {
        username = $("#username").val()
        $.cookie("username", username, { expires: 7 });
        firstName = false
        selfWarning('You have changed your name to ' + username)
    }
    else if (data.status == 'bad') {
        selfWarning('There is a person with that name. Please choose another name.');
        $("#username").val('')
    }
})
//client gửi dữ liệu lên server
$(document).ready(function () {
    //check xem da join room nao chua
    $("#send").click(function () {
        sendMessage();
    });
    $(document).on('keypress', function (e) {
        if (e.which == 13 && $("#message").is(":focus")) {
            socket.emit("no_longer_typing");
            sendMessage();
        }
        else if ($("#message").is(":focus")) {
            socket.emit("is_typing");
            clearTimeout(timeout);
            timeout = setTimeout(function () { socket.emit("no_longer_typing") }, 5000);
        }
    });

    $('#changename').click(function () {
        if ($("#username").val() != "") {
            if ($("#username").val() != username || firstName == true) {
                // Declare variables
                var table, tr, td, txtValue, check = false;
                table = document.getElementById("room-member");
                tr = table.getElementsByTagName("tr");

                //kiem tra xem co ai trung ten khong
                for (let i = 0; i < tr.length; i++) {
                    td = tr[i].getElementsByTagName("td")[0];
                    if (td) {
                        txtValue = td.textContent || td.innerText;
                        // console.log(txtValue);
                        // console.log($("#username").val());
                        if (txtValue.localeCompare($("#username").val()) == 0) {
                            check = true;
                            break;
                        }
                    }
                }
                if (check == false) {
                    socket.emit("change_username", { username: $("#username").val() })
                }
                else {
                    var warning = "There is a person with that name. Please choose another name."
                    selfWarning(warning)
                    $("#username").val('')
                }
            }
        }
        else {
            $("#username-empty").show();
        }
    });

    $("#join-button").click(function () {
        if ($("#join-room-username").val() == "") {
            $("#join-name-empty").show();
        }
        else if ($("#join-room-id").val() == null) {
            $("#join-room-empty").show();
        }
        else {
            if (room != $("#join-room-id").val()) {
                roomCheck == true;
                if (username != $("#join-room-username").val()) {
                    socket.emit("change_username", { username: $("#join-room-username").val() }),
                        username = $("#join-room-username").val();
                    $.cookie("username", username, { expires: 7 });
                    $("#username").val($("#join-room-username").val());
                }
                socket.emit("join", { room: $("#join-room-id").val(), password: $("#join-room-password").val(), type: 0 });
                $("#join-spinner").show();
            }
            else {
                $("#join-modal").modal('hide')
            }
        }
    })
    $("#host-button").click(function () {
        var roomID = $('#host-room-id').val().trim()
        if (roomID == "") {
            //room name empty
            $("#host-room-empty").show()
        }
        else if (existRoom.map(function (e) { return e.roomName }).indexOf(roomID) != -1) {
            //room name taken
            $("#host-room-taken").show();
        }
        else {
            var nameExpression = /^[_A-z0-9]*((-|\s)*[_A-z0-9])*$/g;
            var nameRegex = new RegExp(nameExpression);
            if (nameExpression.test(roomID) == false) {
                $('#host-room-regex-error').show()
            }
            else {
                $("#host-spinner").show();
                if (room != roomID) {//Tao mot room moi
                    $("#chat-content tr").remove()
                    room = roomID;
                    password = $("#host-room-password").val();
                    socket.emit("join", { room: roomID, password: $("#host-room-password").val(), type: 1 });
                    document.getElementById('room-iddisplay').innerHTML = roomID;
                }
                roomCheck = true
                socket.emit("room_update")
                $("#host-modal").modal('hide')
                $("#host-spinner").hide();
                $('#host-room-id').val("")
                $("#host-room-password").val("")
            }
        }
    })
    $("#join-modal").on('show.bs.modal', function () {
        $("#join-room-username").val($("#username").val())
    });
    $("#join-room-username").click(function () {
        $("#join-name-taken").hide()
        $("#join-name-empty").hide()
    })
    $("#join-room-password").click(function () {
        $("#join-password-wrong").hide()
    })
    $("#join-room-id").click(function () {
        $("#join-room-empty").hide()
    })
    $("#host-room-id").click(function () {
        $("#host-room-taken").hide()
        $("#host-room-empty").hide()
        $("#host-room-regex-error").hide()
    })
    $("#username").click(function () {
        $("#username-empty").hide()
    })
    $("#join-modal").on('hide.bs.modal', function () {
        $("#join-spinner").hide();
    })
});

function sendMessage() {
    if ($("#message").val() != "") {
        var message = $("#message").val()
        socket.emit("send_message", { message: message })
        pushMessage(username, message)
        $("#message").val('');
        $("#chat-card").scrollTop($("#chat-table").height());
    }
}

function joinRoomInit(joinRoom) {
    if (joinRoom != room) {
        if (joinRoom != "Public") {
            $("#join-room-username").val(username);
            $("#join-room-id").val(joinRoom);
            $("#join-modal").modal();
        }
        else {
            socket.emit("join", { room: "Public", password: "", type: 0 });
        }
    }
    else {
        $('#room-modal').modal('hide')
    }
}

function roomFilter() {
    // Declare variables
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("room-search-input");
    filter = input.value.toUpperCase();
    table = document.getElementById("room-list");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function addIcon(emoji) {
    $("#message").val($("#message").val() + $(emoji).html()).focus();
}

function selfWarning(message) {
    var newrow = '<tr class="chat-line"><td class="text-success align-middle pl-3">' + message + '</td></tr>'
    if (!$(".is-typing").length)
        $("#chat-content").append(newrow);
    else {
        $(".is-typing").first().before(newrow);
    }
}

function htmlFilter(input) {
    var output = input.split("<").join("&lt;");
    output = output.split(">").join("&gt;");
    return output
}

function kickInit(username) {
    socket.emit("kick_user", { username: username })
}

function pushMessage(username, message) {
    var message = htmlFilter(message)
    if (message.match(urlRegex)) {
        newrow = '<tr class="chat-line"><td class="text-info chat-name align-middle pl-3">'
            + username + ': <a href="' + message + '" class="text-break text-center" target="_blank">' + message + '</a></td></tr>'
    }
    else if ($.cookie('theme') == 'light') {
        newrow = '<tr class="chat-line"><td class="text-info chat-name align-middle pl-3">'
            + username + ': <span class="text-break text-center theme-text-light">' + message + '</span></td></tr>'
    }
    else if ($.cookie('theme') == 'dark') {
        newrow = '<tr class="chat-line"><td class="text-info chat-name align-middle pl-3">'
            + username + ': <span class="text-break text-center theme-text-dark">' + message + '</span></td></tr>'
    }
    if (!$(".is-typing").length)
        $("#chat-content").append(newrow);
    else {
        $(".is-typing").first().before(newrow);
    }
}