const express = require('express')
const app = express()
const mongoose = require('mongoose')


const http = require('http').Server(app)
const io = require('socket.io')(http)


const bodyParser = require('body-parser')
const session = require('express-session')
const ejs = require('ejs')

const crypto = require('crypto-js')
const nodemailer = require('nodemailer')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy

const path = require('path')
const dotenv = require('dotenv')
dotenv.config()

require('./db/mongoose');

const User = require('./schema/user');
const Chat = require('./schema/chat');

const sha256 = require('sha256')
const flash = require('express-flash');


app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(flash());
app.use(
	session({
		// eslint-disable-next-line no-undef
		secret: process.env.SECRET_KEY,
		resave: false,
		saveUninitialized: false
	})
);

app.use(passport.initialize());
app.use(passport.session());

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => User.find({ email: email },(err,results)=>{
		if(err) {
			return error
		}
		else {
			//console.log(results);
			return results
		}
	}),
  id => User.find({ id: id },(err,results)=>{
		if(err) {
			return error
		}
		else {
			//console.log(results);
			return results
		}
	})
)



io.on('connection',(socket)=>{

	socket.on('join-room',(data) => {
		socket.join(data.room)
		console.log('joined in room: ',data.room);
	})
	socket.on('send message',(data) => {
		var sendToRoom = data.receiver + data.e;
		var tmp = data;
		//console.log('sending to room: ',sendToRoom);
		Chat.find({room: sendToRoom},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				if(results.length !== 0) {
					var time = new Date();
					results[0].messages.push({
						time: time,
						message: data.message,
						sender: data.sender,
						receiver: data.receiver,
						k: data.k
					});
					//results[0].save()
					var i = 0;
					if(results[0].header.length == 0) {
						results[0].header.push({val:false,sender:data.sender});
						results[0].save()
						tmp.header = false;
						//console.log('just before sending... ',sendToRoom);
						socket.to(sendToRoom).emit('receive message',tmp);
						//console.log('yahase send');
					}
					else {
						console.log('inside else as header length is not 0');
						console.log(results[0].header);
						for(i=0;i<results[0].header.length;i++) {
							if(results[0].header[i].sender == data.sender) {
								tmp.header = results[0].header[i].val;
								//console.log('just before sending... ',sendToRoom);
								socket.to(sendToRoom).emit('receive message',tmp);
								//console.log('or yahase send..');
								break;
							}
						}
						console.log('value of i = ',i);
						if(i == results[0].header.length) {
							results[0].header.push({
								val: false,
								sender: data.sender
							});
							results[0].save((err,results) => {
								if(err) {
									console.log('error: ',err);
								}
								else {
									console.log('pushed val = ',false,' and sender = ',data.sender,' and saved');
									tmp.header = false;
									socket.to(sendToRoom).emit('receive message',tmp);
								}
							})
						}
						else {
							results[0].save()
						}
					}
				}
				else {
					var time = new Date();
					var chat = new Chat();
					chat.room = sendToRoom;
					chat.messages.push({
						time: time,
						message: data.message,
						sender: data.sender,
						receiver: data.receiver,
						k: data.k
					});
					chat.header.push({val: false, sender: data.sender})
					chat.save()
					tmp.header = false;
					//console.log('just before sending... ',sendToRoom);
					socket.to(sendToRoom).emit('receive message',tmp);
					//console.log('or finally yahase');
				}
			}
		}) //chat find for sendToRoom gets over here..
		Chat.find({room: data.room},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				console.log('inside down');
				if(results.length !== 0) {
					var time = new Date();
					results[0].messages.push({
						time: time,
						message: data.message,
						sender: data.sender,
						receiver: data.receiver,
						k: data.k
					});
					var i = 0;
					var flag = 0;
					for(i=0;i<results[0].header.length;i++) {
						if(results[0].header[i].sender == data.sender) {
							flag = 1;
							break;
						}
					}
					if(i == results[0].header.length) {
						results[0].header.push({
							val: false,
							sender: data.sender
						})
					}
					results[0].save((err,results) => {
						if(err) {
							throw err;
						}
						else {
							console.log('saved!! \n');
						}
					});
				}
				else {
					var time = new Date();
					var chat = new Chat();
					chat.room = sendToRoom;
					chat.messages.push({
						time: time,
						message: data.message,
						sender: data.sender,
						receiver: data.receiver,
						k: data.k
					});
					chat.header.push({val: false, sender: data.sender})
					chat.save((err,results) => {
						if(err) {
							throw err;
						}
						else {
							console.log('saved neeche bhi!');
						}
					});
				}
			}
		})
	})

	socket.on('accept-header',(data) => {
		console.log('in here....');
		var sendToRoom = data.receiver + data.e;
		console.log('sendToRoom: ',sendToRoom);
		Chat.find({room: sendToRoom},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				console.log('results in here..',results);
				console.log('and the header: ',results[0].header);
				console.log('and the data.receiver: ',data.receiver);
				var i = 0;
				for(i=0;i<results[0].header.length;i++) {
					if(results[0].header[i].sender == data.receiver) {
						results[0].header[i].val = true;
						results[0].save();
						console.log('saved ..');
						break;
					}
				}
				console.log('value of i = ',i);
			}
		})
		Chat.find({room: data.room},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				var i = 0;
				for(i=0;i<results[0].header.length;i++) {
					if(results[0].header[i].sender == data.receiver) {
						results[0].header[i].val = true;
						results[0].save();
						console.log('saveedd .:..');
						break;
					}
				}
			}
		})
	})

	socket.on('get all chats',(data) => {
		Chat.find({room: data.room},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				socket.emit('receive all chats',results);
			}
		})
	})


	socket.on('typing',(data) => {
		var sendToRoom = data.receiver + data.e;
		console.log('sending the typing to room: ',sendToRoom);
		socket.to(sendToRoom).emit('typing',data);
	})

	socket.on('stop typing',(data) => {
		var sendToRoom = data.receiver + data.e;
		socket.to(sendToRoom).emit('stop typing',data);
	})

	socket.on('read all',(data) => {
		var sendToRoom = data.receiver + data.e;
		console.log('sending read all to room: ',sendToRoom);
		console.log('read all by: ',data.sender);
		Chat.find({room: sendToRoom},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				if(results.length == 0) {
					return;
				}
				else {
					results[0].userUnread = true;
					results[0].save((err,results)=> {
						if(err) {
							throw err;
						}
						else {
							console.log('saved read all by: ',data.sender);
							socket.to(sendToRoom).emit('read',data);
							console.log('sending read all to room: ',sendToRoom);
						}
					});
				}
			}
		})
	})

})



app.get('/',(req,res) => {
  if(req.isAuthenticated()) {
    res.redirect('/home')
  }
  else {
    res.render('login')
  }
})

app.get('/login',(req,res) => {
  if(req.isAuthenticated()) {
    res.redirect('/home')
  }
  else {
    res.render('login')
  }
})

app.get('/home',(req,res) => {
  if(req.isAuthenticated()) {
		User.find({},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				//console.log('results: ',results);
				//console.log('req.user[0].name = ',req.user[0].username);
				res.render('home',{
					name: req.user[0].username,
					email: req.user[0].email,
					room: req.user[0].username+req.user[0].email,
					users: JSON.stringify(results)
				})
			}
		})
  }
  else {
    res.redirect('/')
  }
})

app.get('/register',(req,res) => {
  if(req.isAuthenticated()) {
    res.redirect('/home')
  }
  else {
    res.render('register')
  }
})

app.get('/style',(req,res) => {
  res.sendFile(path.join(__dirname,'/public/css/style.css'))
})

app.get('/register-js',(req,res) => {
  res.sendFile(path.join(__dirname,'/public/js/register-js.js'))
})

app.get('/home_scss',(req,res) => {
	res.sendFile(path.join(__dirname,'/public/css/home.scss'))
})


app.get('/user',(req,res) => {
	if(req.isAuthenticated()) {
		var u = req.url.toString().split('?')[1].split('&')[0].split('=')[1]
		Chat.find({room: req.user[0].username+req.user[0].email},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				var i = 0;
				if(results.length == 0) {
					var chat = new Chat({
						room: req.user[0].username+req.user[0].email,
						messages: [],
						userUnread: false
					})
					chat.save();
					res.render('user',{
						email: req.user[0].email,
						room: req.user[0].username+req.user[0].email,
						name: req.user[0].username
					})
				}
				else {
					res.render('user',{
						email: req.user[0].email,
						room: req.user[0].username+req.user[0].email,
						name: req.user[0].username
					})
				}
			}
		})
	}
	else {
		res.redirect('/login')
	}
})



app.post('/login',  passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}))


app.post('/register',(req,res) => {
  console.log('req.body',req.body);
  if(req.isAuthenticated()) {
    res.redirect('/home')
  }
  else {
    var id = sha256(req.body.emailid+req.body.passwordid+req.body.usernameid);
		console.log(id);
    var user = new User({
      email: req.body.emailid,
      username: req.body.usernameid,
      password: req.body.passwordid
    });
		console.log('user for register: ',user);
    user.save(function (err, results) {
      if(err) {
				console.log('yahape error..');
				console.error(err);
      }
      else {
				console.log(results);
        console.log(results._id);
        res.redirect('/home')
      }
    });
  }
})


app.post('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})



app.post('/getAllHOME',(req,res) => {
	if(req.isAuthenticated()) {
		Chat.find({},(err,results) => {
			if(err) {
				throw err;
			}
			else {
				res.json(results)
			}
		})
	}
	else {
		res.redirect('/login')
	}
})




function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

function createRoom(receiver,key,email) {
	var key = crypto.AES.decrypt(key,email).toString(crypto.enc.Utf8);
	var receiver = crypto.AES.decrypt(receiver,key).toString(crypto.enc.Utf8);
	var room = ''
	Chat.find({belongs_to: email},(err,results) => {
		if(results.length == 0) {
			return 'no chat'
		}
		else {
			User.find({email: receiver},(err,results) => {
				if(err) {
					throw err;
				}
				else {
					room = req.user[0].name + '&&&' + results[0].username;
					return room;
				}
			})
		}
	})
}

async function findRoom(receiver,key,email) {
	var rr = createRoom(receiver,key,email)
	if(rr == 0) {
		return 0;
	}
	var key = crypto.AES.decrypt(key,email).toString(crypto.enc.Utf8);
	var receiver = crypto.AES.decrypt(receiver,key).toString(crypto.enc.Utf8);
	var room = ''
	await Chat.find({belongs_to: email},(err,results) => {
		if(err) {
			throw err;
		}
		else {
			if(results.length == 0) {
				return 'no chat';
			}
			var i = 0;
			let rooms = results[0].room;
			for(i=0;i<rooms.length;i++) {
				if(rooms[i] == rr) {
					return rooms[i]
				}
				else {
					var u1 = rr.split('&&&')[0];
					var u2 = rr.split('&&&')[1];
					var newRR = u2 + '&&&' + u1;
					if(newRR == rooms[i]) {
						return rooms[i]
					}
				}
			}
		}
	})
}

http.listen(Process.env.PORT,()=> {
  console.log('listening on 8090');
})
