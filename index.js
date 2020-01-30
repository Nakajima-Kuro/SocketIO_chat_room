// build server
var express = require("express");
var app = express();
app.use(express.static("public"));
app.use(express.static("node_modules"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.set("public", "");

var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(3000);
var building = [];
var roomMember = [];//luu username trong day
var roomSocketID = [];//luu socket ID trong day
// tạo kết nối giữa client và server
io.on("connection", function (socket) { 
    var roomID = "";
    var roomIndex;
    var userIndex;
    var fresh = true;
    var inGroup = false;
    var peerID;
    socket.username = "anonymous";
    //server lắng nghe dữ liệu từ client
    socket.on("send_message", function (data) {
        //sau khi lắng nghe dữ liệu, server phát lại dữ liệu này đến các client khác
        socket.broadcast.to(roomID).emit('server_send', { message: '<div class="text-info mr-1">' + socket.username + ": </div>" + data.message, type: 1 });
    });
    socket.on("is_typing", function () {
        socket.broadcast.to(roomID).emit('server_send', { message: '<div class="text-primary mr-1">' + socket.username + " is typing...</div>", type: 3, username: socket.username});
    });
    socket.on("no_longer_typing", function () {
        socket.broadcast.to(roomID).emit('no_longer_typing', {username: socket.username});
    });
    socket.on("change_username", function (data) {
        socket.username = data.username;
        if (fresh == false && inGroup == true) {
            socket.leave(roomID);
            io.to(roomID).emit("server_send", { message: data.username + " has left!", type: 2 });
            roomMember[roomIndex].splice(userIndex, 1);
            io.to(roomID).emit("group_update", { group: roomMember[roomIndex] });
        }
        socket.emit("server_send", { message: "Change name successful!", type: 2 })
        fresh = false;
    })
    socket.on("join", function (data) {
        fresh = false;
        var index = building.indexOf(data.room);
        if (index == -1) { //room chua duoc tao
            building.push(data.room);
            socket.join(data.room);
            roomIndex = roomMember.length
            roomMember[roomIndex] = new Array();
            roomSocketID[roomIndex] = new Array();
            roomMember[roomIndex].push(socket.username);
            roomSocketID[roomIndex].push(socket.id);
            socket.to(data.room).emit("server_send");
            io.to(data.room).emit("server_send", { message: socket.username + " has joined!", type: 2 });
            io.to(data.room).emit("group_update", { group: roomMember[roomIndex] });
            inGroup = true
        }
        else {  //Da co nguoi tao room nay
            roomIndex = index
            var check = false;
            for (var i = 0; i < roomMember[roomIndex].length; i++) {
                if (roomMember[roomIndex][i].localeCompare(socket.username) == 0)//Trung ten
                {
                    socket.emit("server_send", { message: "This name has been taken! Please change your name before join the room", type: 2 });
                    check = true
                    break;
                }
            }
            if (check == false) {
                socket.join(data.room);
                userIndex = roomMember[roomIndex].length
                roomMember[roomIndex].push(socket.username)
                roomSocketID[roomIndex].push(socket.id)
                io.to(data.room).emit("server_send", { message: socket.username + " has joined!", type: 2 });
                io.to(data.room).emit("group_update", { group: roomMember[roomIndex] });
                inGroup = true;
                // console.log(roomMember[roomIndex]);
                // console.log(roomSocketID[roomIndex]);
            }
        }
        roomID = building[roomIndex]
    });
    socket.on('peerID', function(data){
        peerID = data.peerID;
    });
    socket.on('request_peer_id', function(data){
        // console.log("request_recived");
        for (var i = 0; i < roomMember[roomIndex].length; i++) {
            if (roomMember[roomIndex][i].localeCompare(data.username) == 0)//Trung ten
            {
                socket.broadcast.to(roomSocketID[roomIndex][i]).emit("get_peer_id", {socketID : socket.id})
                // console.log("asking for peer ID");
            }
        }
    });
    socket.on('get_peer_id_respone', function(data){
        // console.log("got the peer ID");
        socket.broadcast.to(data.socketID).emit("request_peer_id_respone", {peerID : data.peerID})
        // console.log("send the peer id to the caller");
    });
    socket.on('disconnect', function () {
        if (fresh == false) {
            socket.leave(roomID);
            io.to(roomID).emit("server_send", { message: socket.username + " has left!", type: 2 });
            roomMember[roomIndex].splice(userIndex, 1);
            roomSocketID[roomIndex].splice(userIndex, 1);
            io.to(roomID).emit("group_update", { group: roomMember[roomIndex] });
        }
    });
});

// create route, display view

app.get("/", function (req, res) {
    res.render("homepage");
});