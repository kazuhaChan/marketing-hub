const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

// @route   POST /api/products
// @desc    Create a product (Sender and Admin)
router.post('/', auth, authorize(['Sender', 'Admin']), upload.array('images', 10), async (req, res) => {
  try {
    const { name, description } = req.body;
    let imageUrls = [];
    let imageUrl = '';
    
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
      imageUrl = imageUrls[0];
    }

    const newProduct = new Product({
      name,
      description,
      imageUrl,
      imageUrls,
      owner: req.user.id
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products
// @desc    Get all products (For Sender, get own; For Poster, get available; For Admin, get all)
router.get('/', auth, async (req, res) => {
  try {
    let products = [];
    if (req.user.role === 'Admin') {
      products = await Product.find({}).sort({ createdAt: -1 });
    } else if (req.user.role === 'Sender') {
      products = await Product.find({ $or: [{ owner: req.user.id }, { ownerId: req.user.id }] }).sort({ createdAt: -1 });
    } else {
      // Poster role: see all available products in the single pool
      products = await Product.find({ isAvailable: true }).sort({ createdAt: -1 });
    }
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
router.put('/:id', auth, authorize(['Sender', 'Admin']), upload.array('images', 10), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    // Make sure user owns product or is Admin
    if (product.owner.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { name, description, isAvailable } = req.body;
    
    if (name) product.name = name;
    if (description) product.description = description;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;
    
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => `/uploads/${file.filename}`);
      product.imageUrls = newImageUrls;
      product.imageUrl = newImageUrls[0];
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
router.delete('/:id', auth, authorize(['Sender', 'Admin']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    if (product.owner.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
