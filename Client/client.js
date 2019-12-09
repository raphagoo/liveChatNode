const socket = io();
socket.on("firstMessage", data => console.log(data));

$('#usernameForm').submit(function(e){
    e.preventDefault(); // prevents page reloading
    $('#usernameForm').hide();
    $('#messageForm').show();
    socket.emit('send-nickname', $("#username").val());
    return false;
});

$('#messageForm').submit(function(e){
    e.preventDefault(); // prevents page reloading
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});

let typing = false;

function typingstopped(){
    typing = false;
    $('#listenerTyping').html('');
}

function onKeyDown(){
    socket.emit('someoneTypes')
}

socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
});

socket.on('update', function(msg){
    $('#messages').append($('<li>').text(msg));
});

socket.on('getMessagesHistory', function(messages){
    $('#messages').empty();
    if(messages !== null) {
        for (let i = 0; i < messages.length; i++) {
            $('#messages').append($('<li>').text(messages[i].date + " " + messages[i].user + " " + messages[i].message));
        }
    }
});

socket.on('someoneTypesReceive', function(msg){
    $('#someoneTypes').html(msg);
    $('#someoneTypes').show().delay(2000).fadeOut();
});
