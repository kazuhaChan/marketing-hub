const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

// @route   POST /api/posts
// @desc    Create a new post (Sender and Admin)
router.post('/', auth, authorize(['Sender', 'Admin']), upload.array('images', 10), async (req, res) => {
  try {
    let { productId, content, platforms, scheduledAt } = req.body;

    // Check if user owns product or is Admin
    const product = await Product.findById(productId);
    if (!product || (product.owner.toString() !== req.user.id && req.user.role !== 'Admin')) {
      return res.status(400).json({ msg: 'Invalid product or unauthorized' });
    }

    if (typeof platforms === 'string') {
      try {
        platforms = JSON.parse(platforms);
      } catch (e) {
        platforms = platforms.split(',').map(p => p.trim());
      }
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    const newPost = new Post({
      product: productId,
      sender: req.user.id,
      content,
      imageUrls,
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
        .populate('product', ['name', 'imageUrl', 'imageUrls'])
        .sort({ createdAt: -1 });
      return res.json(posts);
    } else {
      // Poster/Admin role: get all posts from the single pool
      const posts = await Post.find({})
        .populate('product', ['name', 'description', 'imageUrl', 'imageUrls'])
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
