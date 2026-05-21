/**
 * Facebook Permissions Trigger and Verification Utility
 * 
 * This script automates sending requests to Facebook Graph API endpoints
 * associated with specific permissions (e.g., pages_manage_metadata,
 * pages_manage_engagement, business_management) to register active calls
 * on the Facebook Developer Portal.
 */

const axios = require('axios');
const path = require('path');

// Load environment variables from parent directory .env if available
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Parse command line arguments
const args = {};
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.split('=');
    args[key.replace('--', '')] = value;
  }
});

const USER_TOKEN = args.userToken || process.env.FB_USER_ACCESS_TOKEN;
const PAGE_TOKEN = args.pageToken || process.env.FB_PAGE_ACCESS_TOKEN;
const PAGE_ID = args.pageId || process.env.FB_PAGE_ID;

const API_VERSION = 'v20.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function printSeparator() {
  console.log('\n' + '='.repeat(60) + '\n');
}

async function run() {
  console.log('🚀 Starting Facebook Permissions Verification Script...\n');

  if (!USER_TOKEN) {
    console.error('❌ Error: FB_USER_ACCESS_TOKEN is missing!');
    console.log('\nPlease provide it via .env file or command line:');
    console.log('  node scripts/triggerFacebookAPIs.js --userToken=YOUR_USER_TOKEN --pageToken=YOUR_PAGE_TOKEN --pageId=YOUR_PAGE_ID');
    process.exit(1);
  }

  const activePageToken = PAGE_TOKEN || USER_TOKEN; // Fallback to User Token if Page Token isn't separate

  // List of tests to execute
  const tests = [
    {
      name: 'public_profile',
      description: 'Fetch authenticated user details',
      run: async () => {
        const res = await axios.get(`${BASE_URL}/me`, {
          params: {
            fields: 'id,name,picture',
            access_token: USER_TOKEN
          }
        });
        console.log(`✅ Success: Hello, ${res.data.name} (ID: ${res.data.id})`);
        return res.data;
      }
    },
    {
      name: 'pages_show_list',
      description: 'Retrieve pages managed by the user',
      run: async () => {
        const res = await axios.get(`${BASE_URL}/me/accounts`, {
          params: { access_token: USER_TOKEN }
        });
        const count = res.data.data?.length || 0;
        console.log(`✅ Success: Found ${count} associated pages.`);
        if (count > 0) {
          console.log('   Available Pages:');
          res.data.data.forEach((p, idx) => {
            console.log(`     [${idx + 1}] ${p.name} (ID: ${p.id})`);
          });
        }
        return res.data;
      }
    },
    {
      name: 'business_management',
      description: 'Fetch businesses linked to user profile',
      run: async () => {
        const res = await axios.get(`${BASE_URL}/me/businesses`, {
          params: { access_token: USER_TOKEN }
        });
        const count = res.data.data?.length || 0;
        console.log(`✅ Success: Found ${count} linked business managers.`);
        return res.data;
      }
    }
  ];

  // Add Page-specific tests if Page ID is provided
  if (PAGE_ID) {
    tests.push(
      {
        name: 'pages_read_engagement',
        description: 'Read Page feed contents',
        run: async () => {
          const res = await axios.get(`${BASE_URL}/${PAGE_ID}/feed`, {
            params: { access_token: activePageToken }
          });
          const count = res.data.data?.length || 0;
          console.log(`✅ Success: Retrieved page feed (${count} posts found).`);
          return res.data;
        }
      },
      {
        name: 'pages_manage_posts',
        description: 'Publish a temporary test post to the Page feed',
        run: async () => {
          const res = await axios.post(`${BASE_URL}/${PAGE_ID}/feed`, {
            message: `Facebook Permission Auto-Verification Post [Created at ${new Date().toISOString()}]`,
            access_token: activePageToken
          });
          console.log(`✅ Success: Created post with ID: ${res.data.id}`);
          return res.data; // Returns { id: "post_id" }
        }
      },
      {
        name: 'pages_manage_engagement',
        description: 'Write a comment to verify interaction permissions',
        dependsOn: 'pages_manage_posts',
        run: async (prevResults) => {
          const postId = prevResults['pages_manage_posts']?.id;
          if (!postId) {
            throw new Error('Skipping: pages_manage_posts did not return a valid post ID.');
          }
          const res = await axios.post(`${BASE_URL}/${postId}/comments`, {
            message: 'Auto-verification engagement comment.',
            access_token: activePageToken
          });
          console.log(`✅ Success: Comment posted (ID: ${res.data.id})`);
          return res.data;
        }
      },
      {
        name: 'pages_manage_metadata',
        description: 'Query page app subscriptions for webhook registration',
        run: async () => {
          const res = await axios.get(`${BASE_URL}/${PAGE_ID}/subscribed_apps`, {
            params: { access_token: activePageToken }
          });
          console.log(`✅ Success: Page is subscribed to ${res.data.data?.length || 0} apps.`);
          return res.data;
        }
      }
    );
  } else {
    printSeparator();
    console.log('⚠️  Notice: PAGE_ID was not provided. Skipping page-specific permissions:');
    console.log('   - pages_read_engagement');
    console.log('   - pages_manage_posts');
    console.log('   - pages_manage_engagement');
    console.log('   - pages_manage_metadata');
    console.log('\n💡 Tip: To run these, set FB_PAGE_ID in your .env or pass --pageId=YOUR_PAGE_ID');
  }

  const results = {};
  
  for (const test of tests) {
    printSeparator();
    console.log(`▶️  Testing [${test.name}]`);
    console.log(`   Description: ${test.description}`);
    
    try {
      const res = await test.run(results);
      results[test.name] = res;
    } catch (err) {
      console.error(`❌ Error in [${test.name}]:`, err.response?.data || err.message);
    }
  }

  printSeparator();
  console.log('🎉 Execution Finished!');
  console.log('Please check your Facebook Developer Console to verify the calls were recorded.');
}

run();
