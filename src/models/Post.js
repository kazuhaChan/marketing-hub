const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  imageUrls: [{ type: String }],
  platforms: [{ type: String, enum: ['Facebook', 'Zalo', 'TikTok'] }], // Where this post should go
  scheduledAt: { type: Date }, // Optional scheduling time
  status: { type: String, enum: ['Pending', 'Posted', 'Failed'], default: 'Pending' },
}, { timestamps: true });

PostSchema.pre('save', function(next) {
  if (this.product && !this.productId) this.productId = this.product;
  if (this.productId && !this.product) this.product = this.productId;
  if (this.sender && !this.creatorId) this.creatorId = this.sender;
  if (this.creatorId && !this.sender) this.sender = this.creatorId;
  next();
});

module.exports = mongoose.model('Post', PostSchema);
