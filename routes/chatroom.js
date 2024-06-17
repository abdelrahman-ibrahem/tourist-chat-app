const mongoose = require('mongoose');
const express = require('express');
const Chatroom = require('../models/chatroom');
const Message = require('../models/message');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');



// Middleware to check authentication
const auth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }
  
    try {
      const decoded = jwt.verify(token, 'privatekey');
      req.user = decoded;
      next();
    } catch (e) {
      res.status(400).json({ msg: 'Token is not valid' });
    }
};

// Create a new chatroom
router.post('/', auth, async (req, res) => {
  const { guideId } = req.body;

  const chatroom = new Chatroom({
    sender: req.user.id,
    receiver: await User.findById(guideId),
  });

  await chatroom.save();

  res.json(chatroom);
});

// Get all chatrooms for a user
router.get('/', auth, async (req, res) => {
  let chatrooms;
  if (req.user.role === 'client') {
    chatrooms = await Chatroom.find({ sender: req.user.id }).populate('receiver', 'username');
  } else if (req.user.role === 'guide') {
    chatrooms = await Chatroom.find({ receiver: req.user.id }).populate('sender', 'username');
  }
  res.json(chatrooms);
});

// Get all messages for a chatroom
router.get('/:chatroomId/messages', auth, async (req, res) => {
  const messages = await Message.find({ chatroom: req.params.chatroomId }).populate('sender', 'username').populate('receiver', 'username');
  res.json(messages);
});

// Send a message
router.post('/:chatroomId/messages', auth, async (req, res) => {
  const { content } = req.body;

  // Create a new message
  const chatroomObj = await Chatroom.findById(req.params.chatroomId);
  let receiverId;
  if (req.user.id === chatroomObj.sender) {
    receiverId = chatroomObj.receiver;
  } else {
    receiverId = chatroomObj.sender;
  }
  const message = new Message({
    chatroom: req.params.chatroomId,
    sender: req.user.id,
    receiver: receiverId,
    content,
  });

  await message.save();

  // Update the chatroom with the last message and date
  await Chatroom.findByIdAndUpdate(req.params.chatroomId, {
    lastMessage: content,
    lastMessageDate: new Date()
  });

  res.json(message);
});

router.get('/chatrooms/', auth, async (req, res) => {
  const chatrooms = await Chatroom.find();
  res.json(chatrooms);
});

module.exports = router;
