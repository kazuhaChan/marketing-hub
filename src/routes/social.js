const express = require('express');
const router = express.Router();
const SocialAccount = require('../models/SocialAccount');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const axios = require('axios');

// @route   POST /api/social/link
// @desc    Mock endpoint to link a social account
router.post('/link', auth, authorize(['Poster']), async (req, res) => {
  try {
    const { platform, accountId, accountName, accessToken, refreshToken } = req.body;

    // Validate platform
    if (!['Facebook', 'Zalo', 'TikTok'].includes(platform)) {
      return res.status(400).json({ msg: 'Invalid platform' });
    }

    let account = await SocialAccount.findOne({ user: req.user.id, platform, accountId });
    if (account) {
      // Update existing
      account.accessToken = accessToken;
      account.refreshToken = refreshToken;
      account.accountName = accountName;
      await account.save();
    } else {
      // Create new
      account = new SocialAccount({
        user: req.user.id,
        platform,
        accountId,
        accountName,
        accessToken,
        refreshToken
      });
      await account.save();
    }

    res.json(account);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/social/accounts
// @desc    Get linked accounts for the current user
router.get('/accounts', auth, authorize(['Poster']), async (req, res) => {
  try {
    const accounts = await SocialAccount.find({ user: req.user.id });
    res.json(accounts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/social/post/:postId
// @desc    Manually post a specific post to linked platform
router.post('/post/:postId', auth, authorize(['Poster']), async (req, res) => {
  try {
    const { platform } = req.body;
    const post = await Post.findById(req.params.postId).populate('product');
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const account = await SocialAccount.findOne({ user: req.user.id, platform });
    if (!account) {
      return res.status(400).json({ msg: `No linked account for ${platform}` });
    }

    // This is where actual API integration happens.
    // Let's create a mockup for Facebook Graph API
    if (platform === 'Facebook') {
      console.log(`Mocking Facebook post to account ${account.accountId} using token ${account.accessToken}...`);
      /* Real implementation would look like:
      const fbRes = await axios.post(`https://graph.facebook.com/v20.0/${account.accountId}/feed`, {
        message: post.content,
        link: post.product.imageUrl, // Or product link
        access_token: account.accessToken
      });
      console.log(fbRes.data);
      */
      
      // Update post status if it was pending
      if (post.status === 'Pending') {
        post.status = 'Posted';
        await post.save();
      }

      return res.json({ msg: `Successfully posted to ${platform}`, accountName: account.accountName });
    } else {
      // Other platforms mockup
      return res.json({ msg: `Mocked post to ${platform}`, accountName: account.accountName });
    }

  } catch (err) {
    console.error(err.message);
    // Real implementation should catch axios errors and return meaningful messages
    res.status(500).send('Server Error during posting');
  }
});

module.exports = router;
