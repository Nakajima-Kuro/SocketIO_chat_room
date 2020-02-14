var socket = io();
var username = "Anonymous";
var timeout = undefined;
var existRoom = new Array();
var roomCheck = false;
var room = "";
var password = "";
//client nhận dữ liệu từ server
socket.on("server_send", function (data) {
    var id = data.username + "-is-typing";
    lastChat = false;
    if (data.type == 1) {
        var message = htmlFilter(data.message)
        var newrow = '<tr class="chat-line"><td class="text-info chat-name align-middle pl-3">'
            + username + ': <span class="text-dark text-break text-center">' + message + '</span></td></tr>'
        if (!$(".is-typing").length)
            $("#chat-content").append(newrow);
        else {
            $(".is-typing").first().before(newrow);
        }
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
    $("#member-table").find('tr').remove();
    data.group.forEach(function (member) {
        if (member.name == username || member.name == "Anonymous") {
            $("#room-member").prepend('<tr style="height: 3.2rem;"><td class="text-info align-middle" style="max-width: 190px;">' + member.name +
                '</td><td style="width: 45px;"></td></tr>');
        }
        else {
            $("#room-member").append('<tr style="height: 3.2rem;"><td class="text-info align-middle" style="max-width: 190px;">' + member.name +
                '</td><td style="width: 45px;" class="align-middle">' +
                '<div class="btn-group" role="group">' +
                '<button type="button" id="' + member.name + '" onclick="callInit(this.id)" class="btn btn-sm btn-outline-info call"><i class="fa fa-video-camera" aria-hidden="true"></i></button>' +
                '<button type="button" id="' + member.name + '" onclick="kickInit(this.id)" class="btn btn-sm btn-outline-danger"><i class="fa fa-times" aria-hidden="true"></i></button>' +
                '</div></td></tr>');
        }
    })
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
socket.on("room_update", function (data) {
    existRoom = data.roomList;
    $("#room-list").empty();
    for (let i = 0; i < data.roomList.length; i++) {
        $('#room-list').append('<tr onclick="joinRoomInit(\'' + data.roomList[i].roomName + '\')" data-toggle="modal" data-target="#join-modal"><th scope="row" width="20%">'
            + (i + 1) + '</th><td width="55%">' + data.roomList[i].roomName + '</td><td width="25%">' + data.roomList[i].roomPopulation + '</td></tr>')
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
            room = $("#join-room-id").val();
            password = $("#join-room-password").val();
            document.getElementById('room-iddisplay').innerHTML = "Room " + room;
            data.messageList.forEach(function (data) {
                var message = htmlFilter(data.message)
                var newrow = '<tr class="chat-line"><td class="text-break text-right align-middle" colspan="2">' + message + '</td>'
                    + '<td class="text-info chat-name text-center align-middle">' + data.username + '</td></tr>'
                if (!$(".is-typing").length)
                    $("#chat-content").append(newrow);
                else {
                    $(".is-typing").first().before(newrow);
                }
            })
        }
        roomCheck = true
        $("#join-modal").modal('hide')
        $("#room-modal").modal('hide')
        socket.emit("room_update")
    }
})
socket.on("kick_user", function (data) {
    document.getElementById("kicker").innerHTML = data.kicker
    $("#join-room-id").val("Public")
    $("#kicked-modal").modal()
    socket.emit("join", { room: "Public", password: "", type: 0 });
    setTimeout(
        function () {
            $("#kicked-modal").modal('hide');
        }, 5000);
})
//client gửi dữ liệu lên server
$(document).ready(function () {
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
        if ($("#username").val() != "") {
            if ($("#username").val() != username) {
                // Declare variables
                var table, tr, td, txtValue, check = false;
                table = document.getElementById("room-member");
                tr = table.getElementsByTagName("tr");

                // Loop through all table rows, and hide those who don't match the search query
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
                    username = $("#username").val()
                    socket.emit("change_username", { username: $("#username").val() })
                }
                else {
                    var warning = "There is a person with that name. Please choose another name."
                    selfWarning(warning)
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
        if ($('#host-room-id').val() == "") {
            //room name empty
            $("#host-room-empty").show()
        }
        else if (existRoom.map(function (e) { return e.roomName }).indexOf($('#host-room-id').val()) != -1) {
            //room name taken
            $("#host-room-taken").show();
        }
        else {
            var regex = /[^a-zA-Z0-9]/;
            if (regex.test($("#host-room-id").val())) {
                $('#host-room-regex-error').show()
            }
            else {
                $("#host-spinner").show();
                if (room != $("#host-room-id").val()) {//Tao mot room moi
                    $("#chat-content tr").remove()
                    room = $("#host-room-id").val();
                    password = $("#host-room-password").val();
                    socket.emit("join", { room: $("#host-room-id").val(), password: $("#host-room-password").val(), type: 1 });
                    document.getElementById('room-iddisplay').innerHTML = "Room " + $("#host-room-id").val();
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
        var message = htmlFilter($("#message").val())
        socket.emit("send_message", { message: message })
        var newrow = '<tr class="chat-line"><td class="text-info chat-name align-middle pl-3">'
            + username + ': <span class="text-dark text-break text-center">' + message + '</span></td></tr>'
        //neu co dong Somebody + is typing => chen message len tren dong do
        if (!$(".is-typing").length)
            $("#chat-content").append(newrow);
        else {
            $(".is-typing").first().before(newrow);
        }
        $("#message").val('');
        $("#chat-card").scrollTop($("#chat-table").height());
    }
}

function joinRoomInit(room) {
    $("#join-room-username").val(username);
    $("#join-room-id").val(room);
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