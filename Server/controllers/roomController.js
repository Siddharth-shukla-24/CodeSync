const Room = require('../model/Room');

// Resolve a user's role in a room: 'owner', 'member', or null (no access).
function roleFor(room, userId) {
  if (!userId) return null;
  if (room.owner && room.owner.toString() === userId) return 'owner';
  if (room.members.some((m) => m.toString() === userId)) return 'member';
  return null;
}

// Create-or-join: first entrant owns the room; anyone who knows the id and is
// authenticated joins as a member (link-share model). Returns the caller's role.
const enterRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId || !roomId.trim()) {
      return res.status(400).json({ success: false, message: 'roomId is required' });
    }
    const id = roomId.trim();
    let room = await Room.findOne({ roomId: id });

    if (!room) {
      room = await Room.create({
        roomId: id,
        createdBy: req.user.username,
        owner: req.user.id,
        members: [req.user.id],
      });
      return res.status(201).json({ success: true, room, role: 'owner' });
    }

    if (!roleFor(room, req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }
    return res.json({ success: true, room, role: roleFor(room, req.user.id) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    const role = roleFor(room, req.user.id);
    if (!role) return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, room, role });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Owner-only privileged action.
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (roleFor(room, req.user.id) !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only the owner can delete this room' });
    }
    await Room.deleteOne({ _id: room._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = { enterRoom, getRoom, deleteRoom, roleFor };
