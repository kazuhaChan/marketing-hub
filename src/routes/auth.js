const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const authorize = require('../middleware/authorize');
const nodemailer = require('nodemailer');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user (Admin only)
router.post('/register', auth, authorize(['Admin']), async (req, res) => {
  try {
    const { username, email, role } = req.body;
    
    if (!username || !email || !role) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    if (!['Sender', 'Poster'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role specified' });
    }
    
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
      msg: `${role} account created successfully!`
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
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide both email and password' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    
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

// @route   GET /api/auth/users
// @desc    Get all users (Admin only)
router.get('/users', auth, authorize(['Admin']), async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete a user (Admin only)
router.delete('/users/:id', auth, authorize(['Admin']), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ msg: 'You cannot delete your own admin account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/auth/users/:id/change-password
// @desc    Change a user's password (Admin only)
router.put('/users/:id/change-password', auth, authorize(['Admin']), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ msg: 'User not found' });

    userToUpdate.password = newPassword;
    await userToUpdate.save();

    res.json({ msg: `Password for user "${userToUpdate.username}" updated successfully!` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset OTP and email it to the user
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Please provide an email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'No user account found with this email address' });
    }

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set code and expiration (10 minutes)
    user.resetPasswordCode = code;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // SMTP Configuration from env or fallback console logging
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: `"MarketingHub Support" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "MarketingHub - Password Reset Verification Code",
        text: `Your password reset verification code is: ${code}. It will expire in 10 minutes.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 25px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #334155;">
                <h2 style="color: #3b82f6; text-align: center; margin-bottom: 20px;">Password Reset Verification</h2>
                <p>You requested a password reset for your MarketingHub account.</p>
                <p>Please use the following 6-digit verification code to complete your password reset:</p>
                <div style="font-size: 2.2rem; font-weight: 800; text-align: center; background-color: #1e293b; color: #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0; letter-spacing: 0.15em; border: 1px dashed #334155;">
                  ${code}
                </div>
                <p style="color: #94a3b8; font-size: 0.85rem; text-align: center; margin-top: 20px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
              </div>`
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Verification email sent to ${user.email}`);
    } else {
      console.log("\n========================================================");
      console.log(`[DEVELOPMENT MODE] PASSWORD RESET CODE FOR ${user.email}:`);
      console.log(`CODE: ${code}`);
      console.log("========================================================\n");
    }

    res.json({ msg: 'A 6-digit verification code has been sent to your email address!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/auth/reset-password
// @desc    Verify OTP code and change password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ msg: 'Please enter all fields (email, code, newPassword)' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification code' });
    }

    // Update password (pre-save hook hashes this automatically)
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ msg: 'Your password has been successfully reset! You can now log in.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
