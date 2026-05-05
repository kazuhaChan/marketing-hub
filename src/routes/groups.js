const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Create Group
router.post('/', auth, authorize(['Sender']), async (req, res) => {
  try {
    const { name } = req.body;
    const invitationCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    const newGroup = new Group({
      name,
      invitationCode,
      owner: req.user.id
    });
    
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Join Group
router.post('/join', auth, authorize(['Poster']), async (req, res) => {
  try {
    const { invitationCode } = req.body;
    
    const group = await Group.findOne({ invitationCode });
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Already a member' });
    }
    
    group.members.push(req.user.id);
    await group.save();
    
    res.json({ msg: 'Successfully joined group' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
