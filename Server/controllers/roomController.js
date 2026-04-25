const Room = require('../model/Room');

const createRoom= async (req,res)=>{
  try{
    const{roomId,createdBy}=req.body;
    const existingroom= await Room.findOne({roomId});
    if(existingroom){
      return res.status(400).json({success:false,message:'Room already exist'});
    }
    const room=new Room({roomId, createdBy});
    await room.save();

    res.status(201).json({success:true,room});
  }catch(err){
    res.status(500).json({success:false, message:'server error',error:err.message});
  }
};

const getRoom=async(req,res)=>{
try{
  const room= await Room.findOne({roomId:req.params.roomId});

  if(!room){
    return res.status(404).json({success:false,message:'Room not found'});
  }

  res.json({success:true, room});
}catch (err){
  res.status(500).json({success:false, message:'Server error', error:err.message});
}
};

const joinRoom=async (req,res)=>{
  try{
    const {roomId,username}=req.body;

    const room=await Room.findOne({roomId});

    if(!room){
      return res.status(404).json({success:false,message:'Room not found'});
    }

    res.json({success:true, message:`${username} joined ${roomId}`});
  }catch(err){
    res.status(500).json({success:false,message:'Server not found',error:err.message});
  }
};

module.exports={createRoom,getRoom,joinRoom};