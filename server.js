//
// # Practice Real Estate Website
//
//

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
	res.render('dash', {something: context});
});

app.get('/chat', function(req, res, next){
	var context = {};
	context = 'Chat';
	res.render('chat', {something : context});	
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
var io = require('socket.io').listen(server);
mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
        if(err){ throw err; }
        io.on('connection', function(socket){
                console.log("a user connected");
		var col = db.collection('messages');
		var sendStatus = function(str){
			socket.emit('status', str)
		};

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
				});
				
			}
                });

                socket.on('disconnect', function(){
                        console.log("user disconnected");
                });
        });
});
