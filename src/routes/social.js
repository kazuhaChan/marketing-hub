const express = require('express');
const router = express.Router();
const SocialAccount = require('../models/SocialAccount');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const axios = require('axios');

// @route   POST /api/social/link
// @desc    Link a social account (OAuth callback)
router.post('/link', auth, authorize(['Poster', 'Admin']), async (req, res) => {
  try {
    const { platform, code, redirectUri } = req.body;

    if (platform !== 'Facebook') {
      return res.status(400).json({ msg: 'Currently only Facebook is supported for real linking' });
    }

    if (!code || !redirectUri) {
      return res.status(400).json({ msg: 'Missing OAuth code or redirectUri' });
    }

    // Check for developer sandbox simulation code
    if (code === 'mock_sandbox_code') {
      let account = await SocialAccount.findOne({ user: req.user.id, platform, accountId: '1093490013856577' });
      if (account) {
        account.accessToken = 'mock_access_token';
        account.accountName = 'Kaiyo Vietnam Shop (Sandbox)';
        await account.save();
      } else {
        account = new SocialAccount({
          user: req.user.id,
          platform,
          accountId: '1093490013856577',
          accountName: 'Kaiyo Vietnam Shop (Sandbox)',
          accessToken: 'mock_access_token'
        });
        await account.save();
      }
      return res.json([account]);
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

// @route   GET /api/social/page-feed/:accountId
// @desc    Get Facebook Page feed and engagement metrics (pages_read_engagement)
router.get('/page-feed/:accountId', auth, authorize(['Poster', 'Admin']), async (req, res) => {
  try {
    const account = await SocialAccount.findOne({ _id: req.params.accountId, user: req.user.id });
    if (!account) {
      return res.status(404).json({ msg: 'Linked account not found' });
    }

    if (account.platform !== 'Facebook') {
      return res.status(400).json({ msg: 'Platform not supported' });
    }

    if (account.accessToken === 'mock_access_token') {
      // Return high-fidelity English mock Facebook feed and engagement metrics
      const mockPosts = [
        {
          id: 'post_mock_1',
          message: 'Introducing our new Eco-Friendly Bamboo Kitchenware Collection! Crafted from 100% sustainable resources. Get 20% off today with code ECOTREAT at checkout! 🌿🌱 #GoGreen #SustainableLiving #KitchenEssentials',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
          likesCount: 142,
          commentsCount: 28,
          sharesCount: 15
        },
        {
          id: 'post_mock_2',
          message: 'We are thrilled to announce our expansion into the European distribution channel. Partnering with top logistics services to bring premium goods right to your doorstep. Thank you for your support! ✈️📦',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
          likesCount: 98,
          commentsCount: 14,
          sharesCount: 5
        },
        {
          id: 'post_mock_3',
          message: 'FLASH SALE! For the next 3 hours only, enjoy free shipping on all orders over $50. Use code SHIPFREE on our website. Hurry up, stocks are limited! 🛒💥⏰ #FlashSale #DealsOfTheDay',
          createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
          likesCount: 310,
          commentsCount: 57,
          sharesCount: 32
        }
      ];
      return res.json(mockPosts);
    }

    // Call Facebook Graph API to read feed and engagement
    const feedRes = await axios.get(`https://graph.facebook.com/v20.0/${account.accountId}/feed`, {
      params: {
        fields: 'id,message,story,created_time,likes.summary(true),comments.summary(true),shares',
        access_token: account.accessToken
      }
    });

    const posts = feedRes.data.data || [];
    
    // Format the engagement metrics
    const formattedPosts = posts.map(post => {
      return {
        id: post.id,
        message: post.message || post.story || '(No text content)',
        createdAt: post.created_time,
        likesCount: post.likes?.summary?.total_count || 0,
        commentsCount: post.comments?.summary?.total_count || 0,
        sharesCount: post.shares?.count || 0
      };
    });

    res.json(formattedPosts);
  } catch (err) {
    const fbError = err.response?.data?.error?.message || err.message;
    console.error('Fetch Page Feed Error:', err.response?.data || err.message);
    res.status(500).json({ msg: `Facebook API Error: ${fbError}` });
  }
});


// @route   GET /api/social/accounts
// @desc    Get linked accounts for the current user
router.get('/accounts', auth, authorize(['Poster', 'Admin']), async (req, res) => {
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
router.post('/post/:postId', auth, authorize(['Poster', 'Admin']), async (req, res) => {
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
      
      let imagesToPublish = [];
      if (post.imageUrls && post.imageUrls.length > 0) {
        imagesToPublish = post.imageUrls;
      } else if (post.product?.imageUrls && post.product.imageUrls.length > 0) {
        imagesToPublish = post.product.imageUrls;
      } else if (post.product?.imageUrl) {
        imagesToPublish = [post.product.imageUrl];
      }
      
      try {
        let fbRes;
        if (imagesToPublish.length > 1) {
          // Post multiple photos using attached_media
          const photoIds = [];
          for (const imgPath of imagesToPublish) {
            const imageUrl = imgPath.startsWith('http') ? imgPath : `${baseUrl}${imgPath}`;
            try {
              const uploadRes = await axios.post(`https://graph.facebook.com/v20.0/${account.accountId}/photos`, {
                url: imageUrl,
                published: false,
                access_token: account.accessToken
              });
              if (uploadRes.data && uploadRes.data.id) {
                photoIds.push(uploadRes.data.id);
              }
            } catch (uploadErr) {
              console.error('Error uploading photo to Facebook:', uploadErr.response?.data || uploadErr.message);
            }
          }

          if (photoIds.length > 0) {
            fbRes = await axios.post(`https://graph.facebook.com/v20.0/${account.accountId}/feed`, {
              message: post.content,
              attached_media: photoIds.map(id => ({ media_fbid: id })),
              access_token: account.accessToken
            });
          } else {
            // Fallback if uploading all photos failed
            fbRes = await axios.post(`https://graph.facebook.com/v20.0/${account.accountId}/feed`, {
              message: post.content,
              access_token: account.accessToken
            });
          }
        } else if (imagesToPublish.length === 1) {
          // Post as a single PHOTO
          const imageUrl = imagesToPublish[0].startsWith('http') ? imagesToPublish[0] : `${baseUrl}${imagesToPublish[0]}`;
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
