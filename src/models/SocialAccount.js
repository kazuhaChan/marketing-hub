const mongoose = require('mongoose');

const SocialAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, enum: ['Facebook', 'Zalo', 'TikTok'], required: true },
  accountId: { type: String, required: true }, // The ID on the platform
  accountName: { type: String }, // User's name on the platform
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date },
}, { timestamps: true });

// Ensure a user can only link one account per platform for now, or allow multiple depending on requirements.
// For simplicity, we'll allow multiple but usually we'd unique index [user, platform, accountId].
SocialAccountSchema.index({ user: 1, platform: 1, accountId: 1 }, { unique: true });

module.exports = mongoose.model('SocialAccount', SocialAccountSchema);
