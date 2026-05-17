const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const authorize = require('../middleware/authorize');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a Sender user (Only Poster can do this)
router.post('/register', auth, authorize(['Poster']), async (req, res) => {
  try {
    const { username, email } = req.body;
    const role = 'Sender';
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    // Generate random password
    const generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

    user = new User({ username, email, password: generatedPassword, role });
    await user.save();

    res.status(201).json({ 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role,
      password: generatedPassword,
      msg: 'Sender account created successfully!'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token,
          user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
      }
    );
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile (protected)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password (protected)
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
