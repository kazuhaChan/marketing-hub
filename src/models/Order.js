const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  customerName: { type: String, required: true, trim: true },
  customerNumber: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 1 },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
