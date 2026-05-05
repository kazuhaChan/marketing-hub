const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Group = require('../models/Group');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// @route   POST /api/posts
// @desc    Create a new post (Sender only)
router.post('/', auth, authorize(['Sender']), async (req, res) => {
  try {
    const { productId, groupId, content, platforms, scheduledAt } = req.body;

    // Check if user owns product
    const product = await Product.findById(productId);
    if (!product || product.owner.toString() !== req.user.id) {
      return res.status(400).json({ msg: 'Invalid product or unauthorized' });
    }

    // Check if user owns group
    const group = await Group.findById(groupId);
    if (!group || group.owner.toString() !== req.user.id) {
      return res.status(400).json({ msg: 'Invalid group or unauthorized' });
    }

    const newPost = new Post({
      product: productId,
      group: groupId,
      sender: req.user.id,
      content,
      platforms,
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? 'Pending' : 'Pending' // Will be processed by cron or immediately
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/posts
// @desc    Get all posts based on role
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'Sender') {
      const posts = await Post.find({ sender: req.user.id })
        .populate('product', ['name', 'imageUrl'])
        .populate('group', ['name'])
        .sort({ createdAt: -1 });
      return res.json(posts);
    } else {
      // Poster role: get posts from groups they are in
      const groups = await Group.find({ members: req.user.id }).select('_id');
      const groupIds = groups.map(g => g._id);

      const posts = await Post.find({ group: { $in: groupIds } })
        .populate('product', ['name', 'description', 'imageUrl'])
        .populate('sender', ['username'])
        .sort({ createdAt: -1 });
      return res.json(posts);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
