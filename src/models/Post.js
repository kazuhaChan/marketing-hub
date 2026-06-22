const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  imageUrls: [{ type: String }],
  platforms: [{ type: String, enum: ['Facebook', 'Zalo', 'TikTok'] }], // Where this post should go
  scheduledAt: { type: Date }, // Optional scheduling time
  status: { type: String, enum: ['Pending', 'Posted', 'Failed'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
