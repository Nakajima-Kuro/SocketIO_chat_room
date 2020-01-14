var socket = io();
var username = "anonymous";
var timeout = undefined;
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
    '</td><td style="width: 45px;"><button type="button" class="btn btn-sm btn-outline-info btn-block call" data-toggle="modal" data-target="#call-window" data-toggle="modal" data-target="#call-window">Call</button></td></tr>'));
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
//client gửi dữ liệu lên server
$(document).ready(function () {
    var room = $("#roomid").val('');
    var roomCheck = false;
    document.getElementById("roomiddisplay").innerHTML = "Room " + $("#roomid").val();
    $("#send").click(function () {
        sendMessage();
    });
    $(document).on('keypress', function (e) {
        if (e.which == 13) {
            socket.emit("no_longer_typing");
            sendMessage();
        }
        else {
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
            $("#join").click()
        }
    });

    $("#join").click(function () {
        socket.emit("join", { room: $("#roomid").val() });
        document.getElementById("roomiddisplay").innerHTML = "Room " + $("#roomid").val();
        if (room != $("#roomid").val()) {
            $("#chat-content tr").remove()
            room = $("#roomid").val();
        }
        roomCheck = true
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