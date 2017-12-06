var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var socketIO = require('socket.io');

var rest_routes = require('./rest-router');

/* App configuration */
var app = express();
// CORS middleware
app.use(cors());
// middleware for parsing Content-Type: application/json
app.use(bodyParser.json());
// middleware for parsing Content-Type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// logger middleware
app.use(morgan('combined'));

/* Add routes */
rest_routes(app);

var server = http.Server(app);
const io = socketIO(server);
const PORT = process.env.PORT || 4700;
server.listen(PORT, () => console.log(`Server up on port ${PORT}`));

io.on('connection', (socket) => console.log(`New user connected: ${socket.request.connection.remoteAddress}`));

io.on('connection', (socket) =>
  socket.on('auth', (payload) => activeUsers.ogs[payload.userId].init(socket))
);
