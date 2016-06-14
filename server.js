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
app.use(session({secret: 'OSUeecs'}));

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

var mongo = require('mongodb').MongoClient;
//io === client
var io = require('socket.io').listen(server);

app.get('/', function(req, res, next){
	var context = {};
	context = 'Bootstrap Practice';
	var fixedNav = true;
	res.render('home', {something : context, fixed : fixedNav});
});

app.get('/dashboard', function(req, res, next){
	var context = {};
	context = 'Bootstrap Dashboard';
	var stylesheet = '<link rel="stylesheet" href="/css/sidebar.css">';
	var fixedNav = true;
	res.render('dash', {something : context, style : stylesheet, fixed : fixedNav});
});

app.get('/chat/login', function(req, res, next){
	var context = {};
	context = 'Chat Login';
	var stylesheet = '<link rel="stylesheet" href="/css/cover.css">';
	res.render('loginToChat', {something : context, style : stylesheet});
});

app.post('/chat/login', function(req, res, next){
	mongo.connect('mongodb://127.0.0.1/accounts', function(err, db){
		if(err){ throw err; }
		//get collection called users within accounts dbs
		var col = db.collection('users');
		var stylesheet = '<link rel="stylesheet" href="/css/cover.css">';
		if(req.body.login_name == ""){
			var context = "<script>alert('Must Enter a User Name');</script>";
			res.render('loginToChat', {alert : context, style : stylesheet});
		}else{
			if(req.body.login_password == ""){
				var context = "<script>alert('Must Enter a Password');</script>";
				res.render('loginToChat', {alert : context, style : stylesheet});
			}else{	
				//check if user name is in db; check if user name password matches db password
				//check if user_name already exists: if so, then account is valid
				col.findOne({user_name:req.body.login_name}, function(err, doc){
					if(err){ throw err; }
					if(doc){
						col.findOne({user_name: req.body.login_name, user_password: req.body.login_password}, function(err, doc){
							if(err){ throw err; }
							if(doc){
								req.session.account_name = req.body.login_name;
								req.session.account_password = req.body.login_password;
								res.redirect('/chat');
							}else{
								var context = "<script>alert('Invalid Password');</script>";
								res.render('loginToChat', {alert : context, style : stylesheet});
							}
						});
					}else{
						var context = "<script>alert('Account Does Not Exist');</script>";
						res.render('loginToChat', {alert : context, style : stylesheet});
					}
				});
			}
		}
	});
});

app.post('/chat/createAccount', function(req, res, next){
	mongo.connect('mongodb://127.0.0.1/accounts', function(err, db){
		var col = db.collection('users');
		if(err){ throw err; }
		var stylesheet = '<link rel="stylesheet" href="/css/cover.css">';
		if(req.body.account_name == ""){
			var context = "<script>alert('Must Enter a User Name');</script>";
			res.render('loginToChat', {alert : context, style : stylesheet});
		}else if(req.body.account_name.length < 8){
			var context = "<script>alert('User Name Must Have At Least 8 Character');</script>";
			res.render('loginToChat', {alert : context, style : stylesheet});
		}else{
			if(req.body.account_password == ""){
				var context = "<script>alert('Must Enter a Password');</script>";
				res.render('loginToChat', {alert : context, style : stylesheet});
			}else if(req.body.account_password_confirm == ""){
				var context = "<script>alert('Must Confirm Password');</script>";
				res.render('loginToChat', {alert : context, style : stylesheet});
			}else if(req.body.account_password != req.body.account_password_confirm){
				var context = "<script>alert('Passwords Do Not Match');</script>";
				res.render('loginToChat', {alert : context, style : stylesheet});
			}else if(req.body.account_password.length < 8){
				var context = "<script>alert('Password Must Contain At Least 8 Characters');</script>";
				res.render('loginToChat', {alert : context, style : stylesheet});
			}else if(req.body.account_password == req.body.account_password_confirm){
				//check if account_name already exists, if so then create account is invalis
				col.findOne({user_name:req.body.account_name}, function(err, doc){
					if(err){ throw err; }
					if(doc){
						var context = "<script>alert('User Name is Already in Use');</script>";
						res.render('loginToChat', {alert : context, style : stylesheet});
					}else{
						//store account name and account password in mongodb called users
						req.session.account_name = req.body.account_name;
						req.session.account_password = req.body.account_password;
						var user = {};
						user.name = req.session.account_name;
						col.insert({user_name: req.session.account_name, user_password: req.session.account_password});
						console.log('created new user');
						io.on('connection', function(socket){
							io.emit('userEntered', user.name);
						});
						res.redirect('/chat');
					}
				});
			}
		}
	});	
});

app.get('/chat', function(req, res, next){
	if(!req.session.account_password && !req.session.account_name){
		res.redirect('/chat/login');
	}else{
		var context = {};
		context = 'Chat';
		var stylesheet = '<link rel="stylesheet" href="/css/chat.css">';
		res.render('chat', {something : context, style : stylesheet, session_name : req.session.account_name || req.session.chat_name});	
	}
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

//connects to chat db if exists, else create dbs called chat
mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
        if(err){ throw err; }
	//io.on('connection') connects to var socket = io() within client script
        io.on('connection', function(socket){
                console.log("a user connected");
                //console.log(req.session.chat_name + " connected");
		
		//create collection called messages within dbs called chat
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
			var date = data.date;
			var whiteSpacePattern = /^\s*$/;
		
			if(whiteSpacePattern.test(name) || whiteSpacePattern.test(message)){
				console.log('Invalid');
				sendStatus('Must Enter a Name and a Message');
			}else{
				col.insert({name: name, message: message, date: date}, function(){
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
