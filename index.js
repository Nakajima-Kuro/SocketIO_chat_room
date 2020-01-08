// build server
Array.prototype.remove = function () {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
var express = require("express");
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.set("public", "");

var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(3000);
var room = [];
// tạo kết nối giữa client và server
io.on("connection", function (socket) {
    var roomID;
    // io.adapter(redis({ host: 'localhost', port: 3000 }));
    socket.username = "anonymous";
    //server lắng nghe dữ liệu từ client
    socket.on("send_message", function (data) {
        //sau khi lắng nghe dữ liệu, server phát lại dữ liệu này đến các client khác
        io.to(data.room).emit("server_send", data.message);
    });
    socket.on("change_username", function (data) {
        socket.username = data.username;
    })
    socket.on("join", function (data) {
        socket.join(data.room);
        roomID = data.room;
        io.to(data.room).emit("server_send", data.username + " has joined!")
        room.push(data.username)
        io.to(data.room).emit("group_update", { group: room })
    })
    socket.on('disconnect', function () {
        room.remove(socket.username)
        socket.to(roomID).emit("server_send", socket.username + " has left!")
        io.to(data.room).emit("group_update", { group: room })
    });
});

// create route, display view

app.get("/", function (req, res) {
    res.render("homepage", {group: room});
});