const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// @route   POST /api/posts
// @desc    Create a new post (Sender and Admin)
router.post('/', auth, authorize(['Sender', 'Admin']), async (req, res) => {
  try {
    const { productId, content, platforms, scheduledAt } = req.body;

    // Check if user owns product or is Admin
    const product = await Product.findById(productId);
    if (!product || (product.owner.toString() !== req.user.id && req.user.role !== 'Admin')) {
      return res.status(400).json({ msg: 'Invalid product or unauthorized' });
    }

    const newPost = new Post({
      product: productId,
      sender: req.user.id,
      content,
      platforms,
      scheduledAt: scheduledAt || null,
      status: 'Pending'
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
        .sort({ createdAt: -1 });
      return res.json(posts);
    } else {
      // Poster/Admin role: get all posts from the single pool
      const posts = await Post.find({})
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
