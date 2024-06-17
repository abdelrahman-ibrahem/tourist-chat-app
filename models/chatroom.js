const mongoose = require('mongoose');

const chatroomSchma = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        type: String
    },
    lastMessageDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Chatroom', chatroomSchma);