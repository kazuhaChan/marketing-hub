const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Place a new order and sync to Google Sheets
router.post('/', auth, async (req, res) => {
  try {
    const { productId, customerName, customerNumber, quantity } = req.body;

    // 1. Validation
    if (!productId || !customerName || !customerNumber) {
      return res.status(400).json({ msg: 'Please provide all required fields (productId, customerName, customerNumber)' });
    }

    const orderQty = parseInt(quantity, 10) || 1;
    if (orderQty <= 0) {
      return res.status(400).json({ msg: 'Quantity must be a positive integer' });
    }

    // 2. Fetch product and verify availability
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    if (!product.isAvailable) {
      return res.status(400).json({ msg: 'Product is currently out of stock/unavailable' });
    }

    // 3. Fetch ordering user's details for logging
    const orderer = await User.findById(req.user.id);
    const ordererName = orderer ? orderer.username : 'Unknown User';

    // 4. Create and save the order in MongoDB
    const newOrder = new Order({
      product: productId,
      productName: product.name,
      customerName,
      customerNumber,
      quantity: orderQty,
      orderedBy: req.user.id
    });

    await newOrder.save();

    // 5. Asynchronously synchronize with Google Sheets if webhook URL is configured
    if (process.env.GOOGLE_SHEETS_URL) {
      axios.post(process.env.GOOGLE_SHEETS_URL, {
        productName: product.name,
        customerName: customerName,
        customerNumber: customerNumber,
        quantity: orderQty,
        orderedBy: ordererName
      }).catch(err => {
        // Log sheet sync errors without blocking the backend response to the user
        console.error('Google Sheets sync failed:', err.message);
      });
    } else {
      console.log('Google Sheets sync skipped (GOOGLE_SHEETS_URL is not set in .env)');
    }

    // 6. Return successful response
    res.status(201).json(newOrder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/orders
// @desc    Retrieve orders according to user roles
router.get('/', auth, async (req, res) => {
  try {
    let orders = [];

    if (req.user.role === 'Admin') {
      // Admins see all orders in the system
      orders = await Order.find({})
        .populate('product')
        .populate('orderedBy', 'username email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'Sender') {
      // Senders see orders for products they created/own
      const myProducts = await Product.find({ owner: req.user.id });
      const myProductIds = myProducts.map(p => p._id);
      
      orders = await Order.find({ product: { $in: myProductIds } })
        .populate('product')
        .populate('orderedBy', 'username email')
        .sort({ createdAt: -1 });
    } else {
      // Posters see orders they placed
      orders = await Order.find({ orderedBy: req.user.id })
        .populate('product')
        .sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
