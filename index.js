const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);


// Import middleware and models
const { socketAuth } = require('./utils/middleware');
const Message = require('./models/message');
const Chatroom = require('./models/chatroom');

// MongoDB connection
const db_connection = require('./utils/db');
db_connection();


const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(morgan('dev'));


// Routes
app.use('/api/auth', require('./routes/user'));
app.use('/api/chatrooms', require('./routes/chatroom'));

app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
})

// Real-time messaging with authentication

io.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  let user;
  try {
    user = jwt.verify(token, 'privatekey');
  } catch (error) {
    console.error('Error verifying token:', error);
    socket.disconnect();
    return;
  }

  socket.user = user;
  // socket.join(user.id);


  socket.on('chat_message', async (body) => {
    try {
      const senderId = socket.user.id;  // Get the sender from the token
      console.log(body);
      console.log(senderId);
      const { chatroomId, content } = body;
      const chatroom = await Chatroom.findById(chatroomId).populate('sender', 'username').populate('receiver', 'username');
      if (!chatroom) {
        return socket.emit('error', 'Chatroom not found');
      }

      const receiverId = chatroom.sender.toString() === senderId ? chatroom.receiver : chatroom.sender;
      const senderObj = chatroom.sender.toString() === senderId ? chatroom.sender : chatroom.receiver;
      console.log(`Receiver ID: ${receiverId}`);

      const messageBody = {
        chatroom: chatroomId,
        sender: senderObj,
        receiver: receiverId,
        message: content,
      };

      const savedMessage = await Message.create(messageBody);

      // Update the chatroom with the last message and date
      chatroom.lastMessage = content;
      chatroom.lastMessageDate = new Date();
      await chatroom.save();

      const messageData = {
        id: savedMessage._id,
        content: savedMessage.message,
        sender: savedMessage.sender.username,
        receiver: savedMessage.receiver.username,
        timestamp: savedMessage.createdAt,
      };
      // await Chatroom.findByIdAndUpdate(chatroomId, {
      //   lastMessage: content,
      //   lastMessageDate: new Date(),
      // });

      // io.to(chatroomId).emit('receiveMessage', savedMessage);

      socket.emit('receiveMessage', messageData);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error.message);
  });
});




const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
 
});