class Building {
    constructor() {
        this.roomList = new Array();//luu cac room
    }
    pushRoom(room) {
        this.roomList.push(room)
    }
    getRoom(roomName) {
        for (let i = 0; i < this.roomList.length; i++) {
            if (roomName == this.roomList[i].getName()) {
                return this.roomList[i];
            }
        }
    }
    popUser(username, roomName) {
        for (let i = 0; i < this.roomList.length; i++) {
            if (roomName == this.roomList[i].getName()) {
                if (this.roomList[i].getPopulation() == 1 && i != 0) {//if alone and room name is not "Public"
                    this.roomList.splice(i, 1)
                }
                else {
                    this.roomList[i].popUser(username)
                }
                break;
            }
        }
    }
    getRoomList() {
        var roomList = [];
        roomList.forEach(i => roomList.push({ roomName: i.getName(), roomPopulation: i.getPopulation() }))
        return roomList;
    }
}
class Room {
    constructor(name, password) {
        this.name = name;//ten phong
        this.password = password;//password
        this.roomMember = new Array();//luu cac user (co dang 1 class User)
    }
    getPopulation() {
        return this.roomMember.length;
    }
    pushUser(user) {
        this.roomMember.push(user);
    }
    popUser(username) {//dung building.popUser instead
        try {
            for (let i = 0; i < this.roomMember.length; i++) {
                if (username == this.roomMember[i].getName()) {
                    this.roomMember.splice(i, 1);
                    break;
                }
            }
        } catch (e) {
            console.log("error");
        }
    }
}
class User {
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }
    getName() {
        return this.name;
    }
    getSocketID() {
        return this.id;
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
var building = new Building();//luu cac room_name trong day
building.pushRoom(new Room("Public", ""));

// tạo kết nối giữa client và server
io.on("connection", function (socket) {
    //Init
    var self = new User("Anonymous", socket.id)
    var room = building.getRoom("Public");
    socket.join("Public")

    //server lắng nghe dữ liệu từ client

    //Update room list
    socket.on("room_update", function () {
        // console.log("got room update request");
        var roomList = building.getRoomList;
        io.emit("room_update", { roomList: roomList })
    });

    //Message convention:
    //1: normal message
    //2: notify message
    //3: is typing
    //4: warning
    socket.on("send_message", function (data) {
        //sau khi lắng nghe dữ liệu, server phát lại dữ liệu này đến các client khác
        socket.broadcast.to(room.name).emit('server_send', { message: '<div class="text-info mr-1">' + socket.username + ": </div>" + data.message, type: 1 });
    });
    socket.on("send_warning", function (data) {
        socket.emit('server_send', { message: data.message, type: 4 })
    })
    socket.on("is_typing", function () {
        socket.broadcast.to(room.name).emit('server_send', { message: '<div class="text-primary mr-1">' + socket.username + " is typing...</div>", type: 3, username: socket.username });
    });
    socket.on("no_longer_typing", function () {
        socket.broadcast.to(room.name).emit('no_longer_typing', { username: socket.username });
    });

    //Change username
    socket.on("change_username", function (data) {
        if (self.username != data.username) {
            if (room.name != "Public") {
                socket.broadcast.to(room.name).emit("server_send", { message: self.name + " has changed name to " + data.username, type: 2 });
                io.to(room.name).emit("group_update", { group: room.roomMember });
            }
            self.username = data.username;
        }
        socket.emit("server_send", { message: "You has changed your name to " + data.username, type: 2 });
    })
    socket.on("join", function (data) {
        //0: Join
        //1: Host
        //2: Rename
        if (data.type == 1) { //room chua duoc tao (Host)
            // console.log("Host");
            if (room.name != "Public") {
                roomChange();
            }
            room = new Room(data.room, data.password);
            building.pushRoom(room);
            room.pushUser(self);
            socket.join(data.room);
            io.to(data.room).emit("group_update", { group: room.roomMember });
        }
        else {  //Da co nguoi tao room nay
            // console.log("Join");
            try {
                if (room.name != "") {
                    roomChange();
                }
                var check = false;
                //Join convention
                //0: wrong password
                //1: Okay
                //2: Name duplicate
                var joinRoom = building.getRoom(data.room)
                if (data.password != joinRoom.password) {//sai mk
                    socket.emit("join_respond", { status: 0 });
                    check = true;
                }
                else { //mod den day roi, mai lam tiep
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
                if (check == false) {//Passed the Firewall
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
                    self.roomID = building[roomIndex].getName();
                }
            } catch (e) {
                socket.emit("server_send", { message: "Something wrong...", type: 2 });
                console.log(e);
            }
        }
        console.log(building);
        console.log(roomMember);
        console.log(roomSocketID);
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
        socket.leave(room.name)
        building.popUser(socket.username, room.name)
    }
});

// create route, display view
app.get("/", function (req, res) {
    res.render("homepage");
});