//initial Socket.io
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
// initial MongoDb
const mongo = require('mongodb').MongoClient;
// Collection
users = [];
connections = [];


// socket 
server.listen(process.env.PORT || 8080);
console.log("Server is Running !!!");

app.use(express.static(__dirname));

//client Page
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});


//Connect to DB
mongo.connect('mongodb://hadi:passw0rd@ds111598.mlab.com:11598/hadiheroku', function (err, client) {
    if (err) {
        throw err;
    }

    //when Client Connect
    io.sockets.on('connection', function (socket) {
        const userDb = client.db('hadiheroku').collection('user');

        connections.push(socket);
        console.log('Connected: %s  socket', connections.length);

        //Disconnect
        socket.on('disconnect', function (data) {
            users.splice(users.indexOf(socket.username), 1);
            updateUsernames();

            connections.splice(connections.indexOf(socket), 1);
            console.log('Disconnected: %s  socket', connections.length);
        });


        //send msg
        socket.on('send message', function (data) {
            console.log("last msg:" + data);
            io.sockets.emit('new message', { msg: data, user: socket.username });
            //add the message to db
            userDb.insert({ name: socket.username, message: data }, function () {
                console.log("added to data base");
            });
        });

        //new user
        socket.on('new user', function (data, callback) {
            callback(true);
            socket.username = data;
            users.push(socket.username);
            updateUsernames();
            populateMessage(userDb);
        });
    });
    console.log('MongoDB Connected');
});


//populate messages from DB
function populateMessage(db) {
    db.find().limit(100).sort({ _id: 1 }).toArray(function (err, oldMsg) {
        if (err) {
            throw err;
        }
        console.log(">>> " + oldMsg);
        io.sockets.emit('get message', oldMsg);
    });
}

//Update Users
function updateUsernames() {
    io.sockets.emit('get users', users);
}