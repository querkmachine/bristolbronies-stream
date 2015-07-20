var settings = require('./config');
var express = require("express");
var app     = express();
var http    = require("http").createServer(app);
var io      = require("socket.io")(http);
var twitter = require("twitter");

var twitterClient = new twitter({
	consumer_key: settings.twitterConsumerKey,
	consumer_secret: settings.twitterConsumerSecret,
	access_token_key: settings.twitterAccessKey,
	access_token_secret: settings.twitterAccessSecret
});

// Websocket gubbins

io.sockets.on("connection", function(socket) {
	socket.on("connect", function() {
		socket.broadcast.emit("alert", "Connected to control panel.");
	});
	socket.on("disconnect", function() {
		socket.broadcast.emit("alert", "Lost connection to control panel.");
	});
	socket.on("reconnect", function() {
		socket.broadcast.emit("alert", "Reconnected to control panel.");
	});
	socket.on("command", function(cmd, params) {
		io.emit("command", cmd, params);
	});
});

app.use("/assets", express.static("assets"));
app.use("/screens", express.static("screens"));
app.use("/service", express.static("service"));

app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

app.get("/admin", function(req, res) {
	res.sendFile(__dirname + "/admin.html");
});

http.listen(settings.port, function() {
	console.log("Listening on port " + settings.port + ".");
});


// Twitter streamin'

twitterClient.stream("statuses/filter", { track: settings.twitterSearch, follow: settings.twitterId }, function(stream) {
	stream.on("data", function(tweet) {
		io.emit("tweet", tweet);
	});
	stream.on("error", function(error) {
		console.log(error);
	});
});