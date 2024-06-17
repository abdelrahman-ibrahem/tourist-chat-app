// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// exports.socketAuth = (socket, next) => {
//   const token = socket.handshake.query.token;

//   if (!token) {
//     return next(new Error('Authentication error'));
//   }

//   try {
//     const decoded = jwt.verify(token, 'privatekey');
//     socket.user = decoded;
//     next();
//   } catch (err) {
//     next(new Error('Authentication error'));
//   }
// };



const jwt = require('jsonwebtoken');

exports.socketAuth = (token) => {
  console.log(token)

  if (!token) {
    return next(new Error('Authentication error: Token is missing'));
  }

  const accessToken = token; // Extract token from header

  jwt.verify(accessToken, 'privatekey', (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }

    return decoded
  });
};

