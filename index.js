class Building {
    constructor(name, password) {
        this.name = name;
        this.password = password;
    }
    validPassword(password) {
        if (password == this.password) {
            return true;
        }
        return false;
    }
    getName() {
        return this.name;
    }
    getPassword() {
        return this.password;
    }
}
// build server
var express = require("express");
var port = process.env.PORT || 3000;
var app = express();
app.use(express.static("public"));
app.use(express.static("node_modules"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.set("public", "");

var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(port);
var building = [];//luu cac room_name trong day
var roomMember = [];//luu username trong day
var roomSocketID = [];//luu socket ID trong day
// building.push("public");
// roomMember[0] = new Array();
// roomSocketID[0] = new Array();
// tạo kết nối giữa client và server
io.on("connection", function (socket) {
    socket.emit("room_update", { roomList: building })
    var roomID = "";
    var roomIndex;
    var userIndex;
    var fresh = true;
    var inGroup = false;
    socket.username = "anonymous";
    //Update room list
    socket.on("room_update", function () {
        // console.log("got room update request");
        var room_name = new Array();
        for (var i in building) {
            room_name.push(building[i].getName())
        }
        io.emit("room_update", { roomList: room_name })
    });
    //server lắng nghe dữ liệu từ client
    socket.on("send_message", function (data) {
        //sau khi lắng nghe dữ liệu, server phát lại dữ liệu này đến các client khác
        socket.broadcast.to(roomID).emit('server_send', { message: '<div class="text-info mr-1">' + socket.username + ": </div>" + data.message, type: 1 });
    });
    socket.on("is_typing", function () {
        socket.broadcast.to(roomID).emit('server_send', { message: '<div class="text-primary mr-1">' + socket.username + " is typing...</div>", type: 3, username: socket.username });
    });
    socket.on("no_longer_typing", function () {
        socket.broadcast.to(roomID).emit('no_longer_typing', { username: socket.username });
    });
    socket.on("change_username", function (data) {
        var currentName = socket.username;
        if (socket.username != data.username) {
            socket.emit("server_send", { message: "Change name successful!", type: 2 })
            socket.username = data.username;
        }
        if (fresh == false && inGroup == true) {
            socket.leave(roomID);
            io.to(roomID).emit("server_send", { message: currentName + " has changed name to " + data.username, type: 2 });
            splice(userIndex)
            io.to(roomID).emit("group_update", { group: roomMember[roomIndex] });
        }
        fresh = false;
    })
    socket.on("join", function (data) {
        fresh = false;
        //0: Join
        //1: Host
        //2: Rename
        if (data.type == 1) { //room chua duoc tao (Host)
            // console.log("Host");
            if (roomID != "") {
                roomChange();
            }
            var room = new Building(data.room, data.password);
            building.push(room);
            socket.join(data.room);
            roomIndex = roomMember.length
            roomMember[roomIndex] = new Array();
            roomSocketID[roomIndex] = new Array();
            roomMember[roomIndex].push(socket.username);
            roomSocketID[roomIndex].push(socket.id);
            socket.to(data.room).emit("server_send");
            io.to(data.room).emit("group_update", { group: roomMember[roomIndex] });
            inGroup = true
        }
        else {  //Da co nguoi tao room nay
            // console.log("Join");
            if (roomID != "") {
                roomChange();
            }
            for (let i = 0; i < building.length; i++) {
                if (building[i].getName() == data.room) {
                    roomIndex = i;
                    break;
                }
            }
            var check = false;
            if (data.password != building[roomIndex].getPassword()) {//sai mk
                socket.emit("join_respond", { status: 0 });
                check = true;
            }
            else {
                for (let i = 0; i < roomMember[roomIndex].length; i++) {
                    if (roomMember[roomIndex][i].localeCompare(socket.username) == 0)//Trung ten
                    {
                        socket.emit("server_send", { message: "This username has been taken", type: 2 })
                        socket.emit("join_respond", { status: 2 })
                        check = true
                        break;
                    }
                }
            }
            if (check == false) {
                socket.join(data.room);
                userIndex = roomMember[roomIndex].length
                roomMember[roomIndex].push(socket.username)
                roomSocketID[roomIndex].push(socket.id)
                socket.emit("join_respond", { status: 1 })
                if (data.type == 0) {
                    io.to(data.room).emit("server_send", { message: socket.username + " has joined!", type: 2 });
                }
                io.to(data.room).emit("group_update", { group: roomMember[roomIndex] });
                inGroup = true;
            }
        }
        roomID = building[roomIndex].getName();
        // console.log(roomMember);
        // console.log(roomSocketID);
        // console.log(roomMember);
        // console.log(building);
    });
    socket.on('request_peer_id', function (data) {
        // console.log("request_recived");
        fresh = false;
        for (var i = 0; i < roomMember[roomIndex].length; i++) {
            if (roomMember[roomIndex][i].localeCompare(data.username) == 0)//Trung ten
            {
                socket.broadcast.to(roomSocketID[roomIndex][i]).emit("get_peer_id", { socketID: socket.id, username: socket.username })
                // console.log("asking for peer ID");
            }
        }
    });
    socket.on('get_peer_id_respone', function (data) {
        fresh = false;
        // console.log("got the peer ID");
        socket.broadcast.to(data.socketID).emit("request_peer_id_respone", { peerID: data.peerID, status: data.status })
        // console.log("send the peer id to the caller");
    });
    socket.on('disconnect', function () {
        if (fresh == false) {
            roomChange();
        }
    });
    socket.on('change_room', function () {
        roomChange();
    })
    function roomChange() {
        for (let i = 0; i < building.length; i++) {
            if (building[i].getName() == roomID) {
                roomIndex = i;
                break;
            }
        }
        if (roomMember[roomIndex].length == 1 && roomID != "") {//alone in the room
            roomMember.splice(roomIndex, 1);
            roomSocketID.splice(roomIndex, 1);
            building.splice(roomIndex, 1);
        }
        else {//there are still people in the room
            splice(userIndex);
            io.to(roomID).emit("server_send", { message: socket.username + " has left!", type: 2 });
            io.to(roomID).emit("group_update", { group: roomMember[roomIndex] });
        }
        socket.broadcast.to(roomID).emit('no_longer_typing', { username: socket.username });
        socket.leave(roomID);
        // console.log(roomMember);
        // console.log(roomSocketID);
    }
    function splice(index) {
        roomMember[roomIndex].splice(index, 1);
        roomSocketID[roomIndex].splice(index, 1);
    }
});

// create route, display view
app.get("/", function (req, res) {
    res.render("homepage");
});