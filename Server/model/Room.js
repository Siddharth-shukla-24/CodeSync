const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId:{
    type: String,
    required: true,
    unique: true
  },
  createdBy:{
    type: String,
    required: true
  },
  createdAt:{
    type:Date,
    default: Date.now
  },

  lastCode:{
    type:String,
    default:'\\Start coding here...\n'
  }
});

module.exports= mongoose.model('Room',roomSchema);