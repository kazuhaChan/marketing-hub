const cron = require('node-cron');
const Post = require('./models/Post');
// A real app would import the social posting logic here and use it
// const { postToFacebook } = require('./services/facebookService');

const initCron = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find pending posts whose scheduled time has passed
      const pendingPosts = await Post.find({ 
        status: 'Pending', 
        scheduledAt: { $lte: now, $ne: null } 
      });

      if (pendingPosts.length > 0) {
        console.log(`Found ${pendingPosts.length} scheduled posts to process.`);
        
        for (let post of pendingPosts) {
          // Here we would iterate over the post platforms and trigger the posting API
          // For now we just mark them as Posted to simulate the process
          
          /*
          if (post.platforms.includes('Facebook')) {
             await postToFacebook(post);
          }
          */

          post.status = 'Posted';
          await post.save();
          console.log(`Processed post ID: ${post._id}`);
        }
      }
    } catch (err) {
      console.error('Error in cron job', err);
    }
  });
};

module.exports = initCron;
