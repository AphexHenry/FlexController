var app = require('express')();
var express = require("express");
var http = require('http').Server(app);
var io = require('socket.io')(http);
var osc = require('node-osc');
var client = new osc.Client('127.0.0.1', 5001);
var clientList = [];

// use public directory
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res)
{
  res.sendfile('index.html');
});


io.on('connection', function(socket)
{
	clientList.push({id:socket.id, x:0, y:0});
	console.log('socket id : ' + socket.id);
	console.log('connection, user count : ' +  clientList.length);

  socket.on('device orientation', function(msg){
  	  for(var i = 0; i < clientList.length; i++)
      {
      	if(clientList[i].id == socket.id)
    		{
          var lY = msg.beta / 30;
          var lX = ((msg.alpha + 180) % 360) / 180;
          lX -= 1;
          lX *= Math.PI;
    			clientList[i].y = lY;
    			clientList[i].x = lX;
          
          client.send('/gyrosc/p' + (i + 1) + '/gyro', lY, 0, lX);
    		}
    	} 
  });

  var timeout = null;
  socket.on('piou', function(msg)
  {
    for(var i = 0; i < clientList.length; i++)
    {
      if(clientList[i].id == socket.id)
      {
        console.log('touch ' + msg.touch)
        client.send('/gyrosc/p' + (i + 1) + '/button', 1, msg.touch);
      }
    }
  });

  socket.on('disconnect', function () {
  	for(var i = 0; i < clientList.length; i++)
  	{
  		if(clientList[i].id == socket.id)
  		{
  			clientList.splice(i, 1);
  		}
  	}
  	console.log('disconnect, user count : ' + clientList.length );
 });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});