var socket = io();
var username = "anonymous";
var timeout = undefined;
var existRoom = new Array();
var roomCheck = false;
var room = "";
var password = ""
//client nhận dữ liệu từ server
socket.on("server_send", function (data) {
    var id = data.username + "-is-typing";
    if (data.type == 1) {
        newrow = '<tr style="height: 3.2rem;"><td class="d-flex">' + data.message + "</td></tr>";
        if (!$(".is-typing").length)
            $("#chat-content").append(newrow);
        else {
            $(".is-typing").first().before(newrow);
        }
    }
    else if (data.type == 2) {
        newrow = '<tr style="height: 3.2rem;"><td class="d-flex"><div class="text-success">' + data.message + "</div></td></tr>"
        if (!$(".is-typing").length)
            $("#chat-content").append(newrow);
        else {
            $(".is-typing").first().before(newrow);
        }
    }
    else if (data.type == 3 && !$("#" + id).length) {
        $("#chat-content").append('<tr class="is-typing" style="height: 3.2rem;" id = "' + id + '"><td class="d-flex">' + data.message + "</td></tr>");
    }
    $("#chat-card").scrollTop($("#chat-table").height());
});
socket.on("group_update", function (data) {
    $("#member-table").find('tr').remove();
    data.group.forEach(member => $("#room-member").append('<tr style="height: 3.2rem;"><td class="text-info" style="max-width: 190px;">' + member +
        '</td><td style="width: 45px;"><button type="button" id="' + member + '" onclick="callInit(this.id)" class="btn btn-sm btn-outline-info btn-block call" data-toggle="modal" data-target="#call-window">Call</button></td></tr>'));
    var numberOfPeople = $('#room-member tr').length;
    $("#people-number").empty().append(numberOfPeople);
});
socket.on("reset_chat", function () {
    $("#chat-content").empty()
});
socket.on("no_longer_typing", function (data) {
    var id = "#" + data.username + "-is-typing"
    $(id).remove();
})
socket.on("room_update", function (data) {
    existRoom = data.roomList;
    $("#join-room-id").find('option').remove();
    data.roomList.forEach(room => $('#join-room-id').append('<option value="' + room + '">' + room + '</option>'));
})
socket.on("join_respond", function (data) {
    if (data.status == 0)//sai mk
    {
        $("#join-password-wrong").show();
    }
    else if (data.status == 2)//trung ten
    {
        $("#join-name-taken").show();
    }
    else if (data.status == 1) {
        if (roomCheck == true && room != $("#join-room-id").val())//dang o trong 1 room nao do
        {
            socket.emit("change_room");
        }
        if (room != $("#join-room-id").val()) {//vao room khac
            $("#chat-content tr").remove()
            document.getElementById('room-iddisplay').innerHTML = "Room " + $("#join-room-id").val();
            room = $("#join-room-id").val();
            password = $("#join-room-password").val();
        }
        roomCheck = true
        socket.emit("room_update")
        $("#join-modal").modal('hide')
    }
})
//client gửi dữ liệu lên server
$(document).ready(function () {
    $("small").hide();
    //check xem da join room nao chua
    socket.emit("room_update")
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
        socket.emit("leave_room", { username: $("#username").val() })
        socket.emit("change_username", { username: $("#username").val() })
        username = $("#username").val()
        if (roomCheck == true) {
            socket.emit("join", { room: room, password: password, type: 2 });
        }
    });

    $("#join-button").click(function () {
        if($("#join-room-username").val() == ""){
            $("#join-name-empty").show();
        }
        else if ($("#join-room-id").val() == null) {
            $("#join-room-empty").show();
        }
        else {
            if (room != $("#join-room-id").val()) {
                roomCheck == true;
                socket.emit("change_username", { username: $("#join-room-username").val() })
                socket.emit("join", { room: $("#join-room-id").val(), password: $("#join-room-password").val(), type: 0 });
            }
            else {
                $("#join-modal").modal('hide')
            }
            $("#username").val($("#join-room-username").val());
        }
    })
    $("#host-button").click(function () {
        if($('#host-room-id').val() == ""){
            //room name empty
            $("#host-room-empty").show()
        }
        else if (existRoom.indexOf($('#host-room-id').val()) != -1) {
            //room name taken
            $("#host-room-taken").show();
        }
        else {
            if (roomCheck == true && room != $("#host-room-id").val())//dang o trong 1 room nao do
            {
                socket.emit("change_room");
            }
            if (room != $("#host-room-id").val()) {//vao room khac
                $("#chat-content tr").remove()
                room = $("#host-room-id").val();
                password = $("#host-room-password").val();
                socket.emit("join", { room: $("#host-room-id").val(), password: $("#host-room-password").val(), type: 1 });
                document.getElementById('room-iddisplay').innerHTML = "Room " + $("#host-room-id").val();
            }
            roomCheck = true
            socket.emit("room_update")
            $("#host-modal").modal('hide')
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
    })
});

function sendMessage() {
    socket.emit("send_message", { message: $("#message").val() })
    var newrow = '<tr style="height: 3.2rem;"><td class="d-flex">' + '<div class="text-info mr-1">'
        + username + ": </div>" + $("#message").val() + "</td></tr>"
    if (!$(".is-typing").length)
        $("#chat-content").append(newrow);
    else {
        $(".is-typing").first().before(newrow);
    }
    $("#message").val('');
    $("#chat-card").scrollTop($("#chat-table").height());
}