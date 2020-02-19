class Building {
    constructor() {
        this.roomList = new Array();//luu cac room
    }
    pushRoom(room) {
        this.roomList.push(room)
    }
    getRoom(roomName) {
        var index = this.roomList.map(function (e) { return e.name }).indexOf(roomName)
        if (index != -1) {
            return this.roomList[index];
        }
    }
    popUser(userID, roomName) {
        var index = this.roomList.map(function (e) { return e.name }).indexOf(roomName)
        if (index != -1) {
            if (this.roomList[index].getPopulation() == 1 && index != 0) {//if alone and room name is not "Public"
                this.roomList.splice(index, 1)
                return 1;
            }
            else {
                this.roomList[index].popUser(userID)
                return 0;
            }
        }
    }
    getRoomList() {
        var roomListSimple = [];
        this.roomList.forEach(i => roomListSimple.push({ roomName: i.name, roomPopulation: i.getPopulation() }))
        return roomListSimple;
    }
}
class Room {
    constructor(name, password, admin) {
        this.name = name;//ten phong
        this.password = password;//password
        this.roomMember = new Array();//luu cac user (co dang 1 class User)
        this.messageList = new Array();//Luu cac doan message vao day
        this.admin = admin;
        this.onlineList = [];
    }
    getPopulation() {
        return this.roomMember.length;
    }
    pushUser(user) {
        this.roomMember.push(user);
    }
    popUser(userID) {//dung building.popUser instead
        try {
            var index = this.roomMember.map(function (e) { return e.id }).indexOf(userID)
            if (index != -1) {
                this.roomMember.splice(index, 1);
            }
        } catch (e) {
            console.log("error");
        }
    }
    getUser(username) {
        var index = this.roomMember.map(function (e) { return e.name }).indexOf(username)
        if (index != -1) {
            return this.roomMember[index];
        }
        else {
            return -1
        }
    }
    addMessage(username, message) {
        this.messageList.push({ username: username, message: message })
    }
    getOnlineName() {
        var onlineName = []
        return onlineName
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
    var self = new User()
    var room = new Room()
    socket.on("init", function (data) {
        //Init
        self = new User("Anonymous", socket.id)
        room = building.getRoom("Public");
        socket.join("Public");
        room.pushUser(self)
        groupUpdate();
        self.peerID = data.peerID;
    })
    //server lắng nghe dữ liệu từ client

    //Update room list
    socket.on("room_update", function () {
        // console.log("got room update request");
        io.emit("room_update", { roomList: building.getRoomList() })
    });

    //Message convention:
    //1: normal message
    //2: notify message
    //3: is typing
    //4: warning
    socket.on("send_message", function (data) {
        //sau khi lắng nghe dữ liệu, server phát lại dữ liệu này đến các client khác
        if (room.name != "Public") {
            room.addMessage(self.name, data.message)
        }
        socket.broadcast.to(room.name).emit('server_send', { message: data.message, username: self.name, type: 1 });
    });
    socket.on("send_warning", function (data) {
        socket.emit('server_send', { message: data.message, type: 4 })
    })
    socket.on("is_typing", function () {
        socket.broadcast.to(room.name).emit('server_send', { message: '<div class="text-primary mr-1">' + self.name + " is typing...</div>", type: 3, username: self.name });
    });
    socket.on("no_longer_typing", function () {
        socket.broadcast.to(room.name).emit('no_longer_typing', { username: self.name });
    });

    //Change username
    socket.on("change_username", function (data) {
        try {//viec check trung ten da duoc kiem tra phia client de giam ganh nang cho server
            if (room.name != "Public") {
                socket.broadcast.to(room.name).emit("server_send", { message: self.name + " has changed name to " + data.username, type: 2 });
            }
            self.name = data.username;
            socket.emit("server_send", { message: "You has changed your name to " + self.name, type: 2 });
            groupUpdate();
        } catch (e) {
            socket.emit("server_send", { message: "Something wrong...", type: 2 });
        }
    })
    socket.on("join", function (data) {
        //0: Join
        //1: Host
        //2: Rename
        if (data.type == 1) { //room chua duoc tao (Host)
            // console.log("Host");
            roomChange();
            room = new Room(data.room, data.password, self);
            building.pushRoom(room);
            room.pushUser(self);
            socket.join(data.room);
            // console.log(room.admin);
            groupUpdate();
        }
        else {  //Da co nguoi tao room nay
            // console.log("Join");
            try {
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
                else {
                    pos = joinRoom.roomMember.map(function (e) { return e.name; }).indexOf(self.name);
                    if (pos != -1) {//da co nguoi voi ten nay
                        socket.emit("server_send", { message: "This username has been taken", type: 2 })
                        socket.emit("join_respond", { status: 2 })
                        check = true
                    }
                }
                if (check == false) {//Passed the Firewall
                    socket.join(data.room);
                    roomTemp = building.getRoom(data.room)
                    roomTemp.pushUser(self);
                    roomChange();
                    room = roomTemp;
                    socket.emit("join_respond", { status: 1, messageList: room.messageList })
                    if (data.type == 0) {
                        io.to(data.room).emit("server_send", { message: self.name + " has joined!", type: 2 });
                    }
                    groupUpdate();
                }
            } catch (e) {
                socket.emit("server_send", { message: "Something wrong...", type: 2 });
                console.log(e);
            }
        }
        // console.log(room);
        // console.log(building.roomList);
    });
    socket.on('kick_user', function (data) {
        if (room.name == "Public") {
            socket.emit("server_send", { message: "So you want to hack, huh? BAM!! 2 steps ahead, ha ha!!!", type: 4 });
        }
        else {
            var kickee = room.getUser(data.username);
            io.to(room.name).emit("server_send", { message: kickee.name + " has been kicked by " + self.name, type: 2 })
            socket.broadcast.to(kickee.id).emit("kick_user", { kicker: self.name })
        }
    })
    socket.on('request_peer_id', function (data) {
        // console.log("request_recived");
        var callee = room.getUser(data.username);
        // console.log(callee);
        socket.broadcast.to(callee.id).emit("get_peer_id", { socketID: socket.id, username: self.name })
    });
    socket.on('get_peer_id_respone', function (data) {
        // console.log("got the peer ID");
        socket.broadcast.to(data.socketID).emit("request_peer_id_respone", { peerID: data.peerID, status: data.status })
        // console.log("send the peer id to the caller");        
    });
    socket.on('group_call_request', function (data) {
        if (data.type == 'new') {
            var peerList = [self.peerID];
            for (let i = 1; i < data.groupCallMember.length; i++) {
                peerList.push(room.getUser(data.groupCallMember[i]).peerID);
            }
            for (let i = 1; i < data.groupCallMember.length; i++) {
                socket.broadcast.to(room.getUser(data.groupCallMember[i]).id).emit("group_call_request", { caller: self.name })
            }
            socket.broadcast.to(room.name).emit("group_call_online_update", { onlineList: [self.peerID] })
        }
        else if (data.type == 'add') {
            for (let i = 0; i < data.groupCallMember.length; i++) {
                socket.broadcast.to(room.getUser(data.groupCallMember[i]).id).emit("group_call_request", { caller: self.name })
            }
        }
    })
    socket.on('group_call_status', function (data) {
        if (data.status == 'in') {
            room.onlineList.push(self)
        }
        else if (data.status == 'out') {
            var index = room.onlineList.map(function (e) { return e.id }).indexOf(self.id)
            if (index != -1) {
                room.onlineList.splice(index, 1)
            }
        }
        var onlinePeer = [];
        room.onlineList.forEach(function (user) {
            onlinePeer.push(user.peerID)
        })
        socket.broadcast.to(room.name).emit("group_call_online_update", { onlineList: onlinePeer })
        groupUpdate();
    })
    socket.on('webcam_fail', function (data) {
        socket.broadcast.to(data.caller).emit("webcam_fail")
    })
    socket.on('disconnect', function () {
        roomChange();
    });
    socket.on('change_room', function () {
        roomChange();
    });
    function roomChange() {
        if (room.name != "Public") {
            socket.broadcast.to(room.name).emit("server_send", { message: self.name + " has left", type: 2 })
        }
        socket.leave(room.name)
        var i = building.popUser(self.id, room.name)
        if (i == 1) {
            io.emit("room_update", { roomList: building.getRoomList() })
        }
        groupUpdate();
        // console.log(building.roomList);
    };
    function groupUpdate() {
        var memberName = []
        room.roomMember.forEach(function (member) {
            memberName.push(member.name)
        })

        var onlineName = [];//who are in video call
        room.onlineList.forEach(function (user) {
            onlineName.push(user.name)
        })

        if (room.name == "Public") {
            io.to(room.name).emit("group_update", { group: memberName, onlineName: onlineName });
        }
        else {
            io.to(room.name).emit("group_update", { group: memberName, onlineName: onlineName, admin: room.admin });
        }
    }
});

// create route, display view
app.get("/", function (req, res) {
    res.render("homepage");
});