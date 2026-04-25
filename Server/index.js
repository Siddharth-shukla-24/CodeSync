const express = require('express');
const http=require('http');
const {Server}=require('socket.io');
const mongoose = require('mongoose');
const cors=require('cors');
require('dotenv').config();

const roomRoutes=require('./routes/roomRoutes');
const Room = require('./model/Room');

const app = express();
const server=http.createServer(app);
const io=new Server(server,{
  cors:{origin:'*'}
});
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log('MONGODB connected'))
  .catch((err)=>console.log('Error:', err));

app.get('/health',(req,res)=>{
  res.json({message:'Server is running'});
});

app.use('/room',roomRoutes);

const roomUsers={};

io.on('connection',(socket)=>{
  console.log('user connected',socket.id);

  socket.on('join-room',({roomId,username})=>{
    socket.join(roomId);

    if(!roomUsers[roomId]) roomUsers[roomId]=[];
    if(!roomUsers[roomId].some(u=>u.socketId===socket.id)){
      roomUsers[roomId].push({socketId:socket.id,username});
    }

    socket.to(roomId).emit('user-joined',{username});
    io.to(roomId).emit('room-users',roomUsers[roomId].map(u=>u.username));

    console.log (`${username} joined room ${roomId}`);
  });

  socket.on('code-change',async ({roomId,code})=>{
    socket.to(roomId).emit('code-update',{code});
  

  await Room.findOneAndUpdate(
    {roomId},
    {lastCode: code},
    {upsert: true}
  );
  });

  socket.on('disconnect',()=>{
    for(const roomId in roomUsers){
      const user=roomUsers[roomId].find(u=>u.socketId===socket.id);
      if(user){
        socket.to(roomId).emit('user-left',{username:user.username});
      roomUsers[roomId]=roomUsers[roomId].filter(u=>u.socketId !== socket.id);
      io.to(roomId).emit('room-users',roomUsers[roomId].map(u=>u.username));
    }
  }
    console.log('user disconnected',socket.id);
  });
});


server.listen(3000,()=>{
  console.log('server started on port 3000');
});
