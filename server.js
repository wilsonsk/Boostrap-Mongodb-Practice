//
// # Practice Real Estate Website
//
//

var chatLogin = require('./chatLoginPassword.js');
var express = require('express');
var session = require('express-session');
//var mysql = require('./dbContentPool.js');
var bodyParser = require('body-parser');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

//Load css or any js (/public)
app.use(express.static(__dirname + '/public'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', 3000);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var server = app.listen(app.get('port'), function(){
	console.log("Express started on 54.201.94.228:" + app.get('port') + ", press Ctrl-C to terminate");
});
/* Socket.io chat Practice  */

app.get('/', function(req, res, next){
	var context = {};
	context = 'Bootstrap Practice';
	res.render('home', {something: context});
});

app.get('/dashboard', function(req, res, next){
	var context = {};
	context = 'Bootstrap Dashboard';
	var stylesheet = '<link rel="stylesheet" href="/css/sidebar.css">';
	res.render('dash', {something: context, style : stylesheet});
});

app.get('/chat/login', function(req, res, next){
	var context = {};
	context = 'Chat Login';
	var stylesheet = '<link rel="stylesheet" href="/css/cover.css">';
	res.render('loginToChat', {something: context, style : stylesheet});
});

app.post('/chat/login', function(req, res, next){
	if(req.body.chat_password == ""){
		var context = "<script>alert('Must Enter a Password');</script>";
		res.render('loginToChat', {alert : context});
	}else if(req.body.chat_password != chatLogin.password){
		var context = "<script>alert('Invalid Password');</script>";
		res.render('loginToChat', {alert : context});
	}else if(req.body.chat_password == chatLogin.password){
		res.redirect('/chat');
	}
});

app.get('/chat', function(req, res, next){
	var context = {};
	context = 'Chat';
	var stylesheet = '<link rel="stylesheet" href="/css/chat.css">';
	res.render('chat', {something : context, style : stylesheet});	
});

app.use(function(req, res){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.type('plain/text');
	res.status(500);
	res.render('500');
});

var mongo = require('mongodb').MongoClient;
//io === client
var io = require('socket.io').listen(server);
mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
        if(err){ throw err; }
        io.on('connection', function(socket){
                console.log("a user connected");
		var col = db.collection('messages');
		var sendStatus = function(str){
			socket.emit('status', str)
		};

		//emit all messages
		//when client connects, retrieve all messages within chat db with limit of 100
		//send db content to socket
		//socket listens to any input - emits to all 
		//.find() is a mongodb method
		//sort by id, last->first to be ordered in client js stored in 'res' which is an array of db objects
		col.find().limit(100).sort({_id: 1}).toArray(function(err, res){
			if(err) { throw err; }
			//to prevent all clients from getting re emitted data when a new user connects: emit only db content to the new user
			socket.emit('output', res);
		});

		//handle any emit input for input 
                socket.on('input', function(data){
                        console.log(data);
			var name = data.name;
			var message = data.message;
			var whiteSpacePattern = /^\s*$/;
		
			if(whiteSpacePattern.test(name) || whiteSpacePattern.test(message)){
				console.log('Invalid');
				sendStatus('Must Enter a Name and a Message');
			}else{
				col.insert({name: name, message:message}, function(){
					console.log('inserted');
					//When a client enters new data, emit the NEW message to ALL clients: send data within an array back to the clients, a single object
					io.emit('output', [data]);

					sendStatus({message: "Message Sent", clear: true});
				});
				
			}
                });

                socket.on('disconnect', function(){
                        console.log("user disconnected");
                });
        });
});
