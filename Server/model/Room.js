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
  // Ownership + access control.
  owner:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  members:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt:{
    type:Date,
    default: Date.now
  },

  lastCode:{
    type:String,
    default:'//Start coding here...\n'
  },

  // Base64-encoded Yjs document state (CRDT source of truth for collaboration).
  ydocState:{
    type:String,
    default:null
  }
});

module.exports= mongoose.model('Room',roomSchema);