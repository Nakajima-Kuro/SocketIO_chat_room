var socket = io("http://localhost:3000");
//client nhận dữ liệu từ server
socket.on("server_send", function (data) {
    $("#chat-content").append('<tr style="height: 3.2rem;"><td class="d-flex">' + data + "</td></tr>");
    $("#chat-card").scrollTop($("#chat-table").height());
});
socket.on("group_update", function (data) {
    $("#member-table").find('tr').remove();
    data.group.forEach(member => $("#room-member").append('<tr style="height: 3.2rem;"><td class="text-info">' + member + "</td></tr>"));
    var numberOfPeople = $('#room-member tr').length;
    $("#people-number").empty().append(numberOfPeople);
})
//client gửi dữ liệu lên server
$(document).ready(function () {
    var room = $("#roomid").val();
    document.getElementById("roomiddisplay").innerHTML = "Room " + $("#roomid").val();
    $("#send").click(function () {
        socket.emit("send_message", { message: '<div class="text-info mr-1">' + $("#username").val() + ": </div>" + $("#message").val(), room: $("#roomid").val() })
        $("#message").val('');
    });
    $(document).on('keypress', function (e) {
        if (e.which == 13) {
            socket.emit("send_message", { message: '<div class="text-info mr-1">' + $("#username").val() + ": </div>" + $("#message").val(), room: $("#roomid").val() })
            $("#message").val('')
        }
    });

    $('#changename').click(function () {
        socket.emit("change_username", { username: $("#username").val() })
    });

    $("#join").click(function () {
        socket.emit("join", { room: $("#roomid").val(), username: $("#username").val() });
        document.getElementById("roomiddisplay").innerHTML = "Room " + $("#roomid").val();
        if (room != $("#roomid").val()) {
            $("#chat-content tr").remove()
            room = $("#roomid").val();
        }
    })
});