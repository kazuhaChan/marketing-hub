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
    console.error('Exchanging code for token...');
    console.error('App ID:', process.env.FB_APP_ID);
    console.error('Redirect URI:', redirectUri);

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

    // 3. Save ALL found Pages to database
    const linkedAccounts = [];
    for (const page of pages) {
      const pageId = page.id;
      const pageName = page.name;
      const pageAccessToken = page.access_token;

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
      linkedAccounts.push(account);
    }

    res.json(linkedAccounts);
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
    const { platform, accountId } = req.body;
    const post = await Post.findById(req.params.postId).populate('product');
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    let account;
    if (accountId) {
      account = await SocialAccount.findOne({ _id: accountId, user: req.user.id });
    } else {
      account = await SocialAccount.findOne({ user: req.user.id, platform });
    }

    if (!account) {
      return res.status(400).json({ msg: `No linked account found for ${platform}` });
    }

    // Real Facebook Integration
    if (platform === 'Facebook') {
      const baseUrl = process.env.BASE_URL || 'http://mkt.kaiyovietnam.vn';
      const hasImage = post.product?.imageUrl;
      const imageUrl = `${baseUrl}${post.product?.imageUrl}`;
      
      try {
        let fbRes;
        if (hasImage) {
          // Post as a PHOTO
          fbRes = await axios.post(`https://graph.facebook.com/v20.0/${account.accountId}/photos`, {
            caption: post.content,
            url: imageUrl,
            access_token: account.accessToken
          });
        } else {
          // Fallback to regular post if no image
          fbRes = await axios.post(`https://graph.facebook.com/v20.0/${account.accountId}/feed`, {
            message: post.content,
            access_token: account.accessToken
          });
        }
        
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
