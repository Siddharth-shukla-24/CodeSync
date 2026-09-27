const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { enterRoom, getRoom, deleteRoom } = require('../controllers/roomController');

router.use(requireAuth); // every room route requires a valid token

router.post('/enter', enterRoom);
router.get('/:roomId', getRoom);
router.delete('/:roomId', deleteRoom);

module.exports = router;
