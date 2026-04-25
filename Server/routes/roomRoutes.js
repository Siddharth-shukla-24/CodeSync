const express=require('express');
const router=express.Router();
const{createRoom,getRoom,joinRoom}=require('../controllers/roomController');

router.post('/create',createRoom);
router.get('/:roomId',getRoom);
router.post('/join',joinRoom);

module.exports=router;
