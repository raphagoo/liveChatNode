
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http);
const mongo = require('mongodb');
const mongoClient = mongo.MongoClient;
const options = {
  keepAlive: 1,
  useUnifiedTopology: true,
  useNewUrlParser: true,
};
const url = "mongodb://localhost:27017/";
let dbo;
let messagesHistory;

//Initialisation BDD
mongoClient.connect(url, options)
    .then(
        response => {
          console.log("Database created");
          dbo = response.db("mydb");
          dbo.createCollection("messages")
              .then(
                  response => {
                    console.log("messages created")
                  },
                  error => {
                    throw error;
                  });
          dbo.createCollection("users")
              .then(
                  response => {
                    console.log("users created")
                  },
                  error => {
                    throw error
                  }
              )
        },
        error => {
          throw error
        });


let users = {};

app.use(express.static(path.join(__dirname, 'Client')));

//Connection d'un utilisateur
io.on('connection', function(socket){

  //Récupération des messages
  dbo.collection('messages').find().toArray()
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
    let messageToInsert = {
      date: utcDate,
      user: users[socket.id],
      message: msg
    };

    //Insertion message en bdd
    dbo.collection('messages').insert(messageToInsert, (err, res) => {
      if(err) throw err;
      console.log("message inserted");
      io.emit('chat message', messageFinal);
    });
  });
});


http.listen(3001, function(){
  console.log('listening on *:3001');
});
