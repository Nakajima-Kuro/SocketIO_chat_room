var socket = io();
var username = "anonymous";
//client nhận dữ liệu từ server
socket.on("server_send", function (data) {
    if (data.type == 1) {
        $("#chat-content").append('<tr style="height: 3.2rem;"><td class="d-flex">' + data.message + "</td></tr>");
    }
    else if (data.type == 2) {
        $("#chat-content").append('<tr style="height: 3.2rem;"><td class="d-flex"><div class="text-success">' + data.message + "</td></tr>");
    }
    $("#chat-card").scrollTop($("#chat-table").height());
});
socket.on("group_update", function (data) {
    $("#member-table").find('tr').remove();
    data.group.forEach(member => $("#room-member").append('<tr style="height: 3.2rem;"><td class="text-info">' + member + "</td></tr>"));
    var numberOfPeople = $('#room-member tr').length;
    $("#people-number").empty().append(numberOfPeople);
})
socket.on("reset_chat", function () {
    $("#chat-content").empty()
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
            sendMessage();
        }
    });

    $('#changename').click(function () {
        socket.emit("leave_room", { username: $("#username").val() })
        socket.emit("change_username", { username: $("#username").val() })
        username = $("#username").val()
        if(roomCheck == true)
        {
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
    $("#chat-content").append('<tr style="height: 3.2rem;"><td class="d-flex">' + '<div class="text-info mr-1">'
        + username + ": </div>" + $("#message").val() + "</td></tr>");
    $("#message").val('');
    $("#chat-card").scrollTop($("#chat-table").height());
}