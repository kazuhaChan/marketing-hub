const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  imageUrls: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

ProductSchema.pre('save', function(next) {
  if (this.owner && !this.ownerId) this.ownerId = this.owner;
  if (this.ownerId && !this.owner) this.owner = this.ownerId;
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
