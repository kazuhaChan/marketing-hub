const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer config for image upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  }
});

// @route   POST /api/products
// @desc    Create a product (Sender only)
router.post('/', auth, authorize(['Sender']), upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let imageUrl = '';
    
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const newProduct = new Product({
      name,
      description,
      imageUrl,
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
// @desc    Get all products (For Sender, get own; For Poster, get all available in groups they joined, but for now we'll fetch all or handle logic in groups)
router.get('/', auth, async (req, res) => {
  try {
    // If sender, return only their products. If poster, return products from groups they are in (for simplicity, we might just return all active products or let the user search)
    let products = [];
    if (req.user.role === 'Sender') {
      products = await Product.find({ owner: req.user.id }).sort({ createdAt: -1 });
    } else {
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
router.put('/:id', auth, authorize(['Sender']), upload.single('image'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    // Make sure user owns product
    if (product.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { name, description, isAvailable } = req.body;
    
    if (name) product.name = name;
    if (description) product.description = description;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;
    
    if (req.file) {
      // Optional: Delete old image
      product.imageUrl = `/uploads/${req.file.filename}`;
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
router.delete('/:id', auth, authorize(['Sender']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    if (product.owner.toString() !== req.user.id) {
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
