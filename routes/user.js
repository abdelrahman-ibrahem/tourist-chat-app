const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = 'privatekey';

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

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  const user = await User.findOne({ username });
  if (user) {
    return res.status(400).json({ msg: 'User already exists' });
  }

  const newUser = new User({ username, password: bcrypt.hashSync(password, 10), role });

  await newUser.save();

  res.json({ msg: 'User registered successfully' });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id}, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});


router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ username: user.username, role: user.role });
});


router.get('/get-profiles', async (req, res) => {
  const users = await User.find();
  res.json(users);
})
module.exports = router;
