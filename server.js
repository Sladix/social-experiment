var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var utils = require('./utils');
var achievments = require('./achievments');
var rc = require('./randomColor');

var boxes = [];
var limit = 150;
var threshold = 20;

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/views/index.html');
});

var commands = {
  shuffle(s,caller){
    if(caller.admin)
      utils.shuffle(boxes);
  },
  iwannabreakallthethings(s,caller){
    caller.admin = true; //NO ADMIN ALLOWED ! FREEDOM ONLY
    io.emit('updateBox',caller);
  },
  anounce(s,caller,msg){
    if(caller.admin && msg.length > 0){
      io.emit('anounce',msg);
    }
  },
  mute(s,caller,target){
    if(!target){ return }
    let t = boxes.find((b)=>{return b.id == target});
    if((caller.modo || caller.admin) && t){
      t.text = '';
      t.muted = true;
      s.broadcast.to(target).emit('muted');
      io.emit('updateBox', t);
    }
  },
  attack(s,caller,target){
    let t = boxes.find((b)=>{return b.id == target});
    let tlevel = utils.computeLevel(t.xp,threshold);
    let clevel = utils.computeLevel(caller.xp,threshold);
    if(tlevel >= clevel && t.alive){
      t.life -= 5;
      achievments.update(caller,'attack');
      if(t.life <= 0 ){
        t.alive = false;
        s.broadcast.to(t.id).emit('muted');
        achievments.update(caller,'victims');
      }
      io.emit('updateBox', t);
      checkAchievments(caller,s);
    }
  },
  heal(s,caller,target){
    let t = boxes.find((b)=>{return b.id == target});
    if(t.life >= 100){
      return;
    }
      t.life += 5;
    achievments.update(caller,'heal');
    io.emit('updateBox', t);
    checkAchievments(caller,s);
  }
};

function checkAchievments(box,socket){
  let res = achievments.achievments(box);
  if(res.updated && res.updated.length > 0){
    box.achievments = [...box.achievments,...res.updated];
    box.xp += res.xp;
    socket.emit('unlockAchievment',res.updated);
    socket.broadcast.emit('updateBox',box);
  }
};

function createBox(socket){
  let nb = {
    id:socket.id,
    text:'',
    joined:(new Date()),
    admin:false,
    muted:false,
    xp:0,
    achievments : [],
    color : rc(), 
    life : 100,
    alive : true
  };
  boxes.push(nb);
  socket.broadcast.emit('addBox', nb);
  socket.emit('grabBoxes', {boxes : boxes, limit : limit, achievementsCount : achievments.achievementsCount});
  socket.broadcast.emit('updateUsercount',boxes.length);
}

io.on('connection', function(socket){
  console.log('a user connected');
  createBox(socket);
  
  socket.on('updateMessage',function(msg){
    let b = boxes.find((b)=>{return b.id === socket.id});
    if(b.muted){
      return;
    }
    b.text = msg;
    checkAchievments(b,socket);
    io.emit('updateBox',b);
  })
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
    let b = boxes.find((b)=>{return b.id === socket.id});
    achievments.cleanCache(b);
    boxes = boxes.filter((b)=>{return b.id !== socket.id});
    socket.broadcast.emit('updateUsercount',boxes.length);
    socket.broadcast.emit('removeBox',socket.id);
  });
  
  socket.on('command',function(msg){
    let spaceLoc = msg.indexOf(' ')
    if (spaceLoc === -1)
      spaceLoc = msg.length
    else
      spaceLoc += 1;
    
    const name = msg.substring(0, spaceLoc).trim();
    const args = msg.substring(spaceLoc).trim();
    
    console.log("Command recieved : "+name+" with args "+args);
    if(commands[name]){
      
      let caller = boxes.find((b)=>{return b.id == socket.id});
      if(!caller || !caller.alive){
        return;
      }
      commands[name](socket,caller,args);
    }
  });
  
  
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});