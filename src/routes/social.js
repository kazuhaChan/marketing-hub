const express = require('express');
const router = express.Router();
const SocialAccount = require('../models/SocialAccount');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const axios = require('axios');

// @route   POST /api/social/link
// @desc    Link a social account (OAuth callback)
router.post('/link', auth, authorize(['Poster']), async (req, res) => {
  try {
    const { platform, code, redirectUri } = req.body;

    if (platform !== 'Facebook') {
      return res.status(400).json({ msg: 'Currently only Facebook is supported for real linking' });
    }

    if (!code || !redirectUri) {
      return res.status(400).json({ msg: 'Missing OAuth code or redirectUri' });
    }

    // 1. Exchange code for access token
    console.log('Exchanging code for token...');
    console.log('App ID:', process.env.FB_APP_ID);
    console.log('Redirect URI:', redirectUri);

    const tokenRes = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
      params: {
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        redirect_uri: redirectUri,
        code: code
      }
    });
    
    const userAccessToken = tokenRes.data.access_token;

    // 2. Get the user's Pages
    const pagesRes = await axios.get('https://graph.facebook.com/v20.0/me/accounts', {
      params: { access_token: userAccessToken }
    });

    const pages = pagesRes.data.data;
    if (!pages || pages.length === 0) {
      return res.status(400).json({ msg: 'No Facebook Pages found for this user. You must own a Facebook Page.' });
    }

    // For simplicity, we link the first Page. 
    // In a more complex app, you'd let them select which page.
    const page = pages[0];
    const pageId = page.id;
    const pageName = page.name;
    const pageAccessToken = page.access_token;

    // 3. Save to database
    let account = await SocialAccount.findOne({ user: req.user.id, platform, accountId: pageId });
    if (account) {
      account.accessToken = pageAccessToken;
      account.accountName = pageName;
      await account.save();
    } else {
      account = new SocialAccount({
        user: req.user.id,
        platform,
        accountId: pageId,
        accountName: pageName,
        accessToken: pageAccessToken
      });
      await account.save();
    }

    res.json(account);
  } catch (err) {
    const fbError = err.response?.data?.error?.message || err.message;
    console.error('OAuth Error:', err.response?.data || err.message);
    res.status(500).json({ msg: `Facebook API Error: ${fbError}` });
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

    // Real Facebook Integration
    if (platform === 'Facebook') {
      const baseUrl = process.env.BASE_URL || 'http://mkt.kaiyovietnam.vn';
      const linkToShare = post.product?.imageUrl ? `${baseUrl}${post.product.imageUrl}` : baseUrl;
      
      try {
        const fbRes = await axios.post(`https://graph.facebook.com/v20.0/${account.accountId}/feed`, {
          message: post.content,
          link: linkToShare,
          access_token: account.accessToken
        });
        
        console.log('Facebook Post Success:', fbRes.data);
        
        // Update post status if it was pending
        if (post.status === 'Pending') {
          post.status = 'Posted';
          await post.save();
        }

        return res.json({ msg: `Successfully posted to ${platform}`, accountName: account.accountName, postId: fbRes.data.id });
      } catch (fbErr) {
        console.error('Facebook API Error:', fbErr.response?.data || fbErr.message);
        return res.status(500).json({ msg: 'Facebook API failed to publish post' });
      }
    } else {
      // Other platforms mockup
      return res.json({ msg: `Mocked post to ${platform}`, accountName: account.accountName });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during posting');
  }
});

module.exports = router;
