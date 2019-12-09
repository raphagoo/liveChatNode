
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http);
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
const url = "mongodb://localhost:27017/";
let messagesHistory;

mongoose.connect(url, {useNewUrlParser: true});
let messageSchema = new Schema({
    date: String,
    user: String,
    message: String
});

let Message = mongoose.model('Message', messageSchema);
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // we're connected!
});


let users = {};

app.use(express.static(path.join(__dirname, 'Client')));

//Connection d'un utilisateur
io.on('connection', function(socket){

  //Récupération des messages
  Message.find()
      .then(
          response => {
            messagesHistory = response;
            socket.emit('getMessagesHistory', messagesHistory);
          },

          error => {
            throw error
          });

  //Nouveau pseudo
  socket.on('send-nickname', function(nickname) {
    users[socket.id] = nickname;
    console.log(users)
  });

  io.emit('Quelqu\'un se connecte');

  socket.on('disconnect', function() {

    console.log('user disconnected');
    io.emit('Quelqu\'un s\'est déconnecté')

  });

  //Quelqu'un écrit
  socket.on('someoneTypes', function(){
    io.emit('someoneTypesReceive', users[socket.id] + " is typing")
  });

  //Envoi de message
  socket.on('chat message', function(msg){
    let dt = new Date();
    let utcDate = dt.toUTCString();
    let messageFinal = utcDate + ' - ' + users[socket.id] + ' : ' + msg;
    let messageToInsert = new Message({
      date: utcDate,
      user: users[socket.id],
      message: msg
    });

    //Insertion message en bdd
    Message.create(messageToInsert, (err, res) => {
      if(err) throw err;
      console.log("message inserted");
      io.emit('chat message', messageFinal);
    });
  });
});


http.listen(3001, function(){
  console.log('listening on *:3001');
});
