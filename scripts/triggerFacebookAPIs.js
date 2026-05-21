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

/**
 * Fetch granted permissions from a token
 */
async function getGrantedPermissions(token) {
  try {
    const res = await axios.get(`${BASE_URL}/me/permissions`, {
      params: { access_token: token }
    });
    if (res.data && res.data.data) {
      return res.data.data
        .filter(p => p.status === 'granted')
        .map(p => p.permission);
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function run() {
  console.log('🚀 Starting Facebook Permissions Verification Script...\n');

  if (!USER_TOKEN) {
    console.error('❌ Error: FB_USER_ACCESS_TOKEN is missing!');
    console.log('\nPlease provide it via .env file or command line:');
    console.log('  node scripts/triggerFacebookAPIs.js --userToken=YOUR_USER_TOKEN --pageToken=YOUR_PAGE_TOKEN --pageId=YOUR_PAGE_ID');
    process.exit(1);
  }

  let activePageToken = PAGE_TOKEN;

  // 1. Proactively exchange User Token for Page Token if Page ID is provided and Page Token is missing/User Token
  if (PAGE_ID && (!activePageToken || activePageToken === USER_TOKEN)) {
    console.log('🔄 Attempting to automatically fetch Page Access Token using your User Token...');
    try {
      const pageTokenRes = await axios.get(`${BASE_URL}/${PAGE_ID}`, {
        params: {
          fields: 'access_token',
          access_token: USER_TOKEN
        }
      });
      if (pageTokenRes.data && pageTokenRes.data.access_token) {
        activePageToken = pageTokenRes.data.access_token;
        console.log('✅ Successfully resolved Page Access Token automatically!');
      } else {
        console.log('⚠️  Could not automatically resolve Page Access Token (response did not contain token).');
      }
    } catch (err) {
      console.log('⚠️  Could not automatically resolve Page Access Token. Error:', err.response?.data?.error?.message || err.message);
      console.log('   We will fall back to using your User Access Token for page operations.');
    }
  }

  if (!activePageToken) {
    activePageToken = USER_TOKEN;
  }

  // 2. Perform detailed diagnostic check
  console.log('\n🔍 Performing diagnostics on access tokens...');
  
  if (USER_TOKEN === activePageToken) {
    console.log('⚠️  Warning: FB_PAGE_ACCESS_TOKEN is not configured separately.');
    console.log('   The script is using the User Access Token for page operations.');
    console.log('   👉 Note: Page operations (posting, comments, metadata) MUST use a Page Access Token.');
    console.log('      Using a User Access Token will cause Facebook to throw "(#200) Insufficient permissions" or "(#10) Requires permission" errors.');
  }

  const userPerms = await getGrantedPermissions(USER_TOKEN);
  if (userPerms) {
    console.log(`\n🔑 User Token Granted Scopes: ${userPerms.join(', ')}`);
    const missingUserPerms = ['public_profile', 'pages_show_list', 'business_management'].filter(p => !userPerms.includes(p));
    if (missingUserPerms.length > 0) {
      console.log(`   ⚠️  Missing scopes on User Token: ${missingUserPerms.join(', ')}`);
    }
  } else {
    console.log('\n⚠️  Could not verify User Access Token scopes. It may be invalid, expired, or have incorrect formatting.');
  }

  if (activePageToken && activePageToken !== USER_TOKEN) {
    const pagePerms = await getGrantedPermissions(activePageToken);
    if (pagePerms) {
      console.log(`🔑 Page Token Granted Scopes: ${pagePerms.join(', ')}`);
      const missingPagePerms = ['pages_read_engagement', 'pages_manage_posts', 'pages_manage_engagement', 'pages_manage_metadata'].filter(p => !pagePerms.includes(p));
      if (missingPagePerms.length > 0) {
        console.log(`   ⚠️  Missing scopes on Page Token: ${missingPagePerms.join(', ')}`);
      }
    } else {
      console.log('⚠️  Could not verify Page Access Token scopes.');
    }
  }

  printSeparator();

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
    console.log('⚠️  Notice: PAGE_ID was not provided. Skipping page-specific permissions:');
    console.log('   - pages_read_engagement');
    console.log('   - pages_manage_posts');
    console.log('   - pages_manage_engagement');
    console.log('   - pages_manage_metadata');
    console.log('\n💡 Tip: To run these, set FB_PAGE_ID in your .env or pass --pageId=YOUR_PAGE_ID');
  }

  const results = {};
  
  for (const test of tests) {
    console.log(`▶️  Testing [${test.name}]`);
    console.log(`   Description: ${test.description}`);
    
    try {
      const res = await test.run(results);
      results[test.name] = res;
    } catch (err) {
      console.error(`❌ Error in [${test.name}]:`, err.response?.data || err.message);
      
      console.log('\n💡 Troubleshooting Checklist:');
      if (USER_TOKEN === activePageToken && ['pages_read_engagement', 'pages_manage_posts', 'pages_manage_engagement', 'pages_manage_metadata'].includes(test.name)) {
        console.log('   👉 CRITICAL: You are using a User Access Token for a Page-level operation.');
        console.log('      This is not allowed by Facebook. The Page endpoints require a Page Access Token.');
        console.log('      We tried to fetch it automatically, but it failed (possibly because of missing scopes).');
      } else {
        console.log(`   👉 Ensure your token has the "${test.name}" permission enabled.`);
      }
      console.log('   👉 Make sure the token has not expired and your Facebook app is in Development/Live mode.');
      console.log('   👉 How to fix: Open https://developers.facebook.com/tools/explorer/');
      console.log(`      Select your app, click "Permissions", add "${test.name}", and generate a new token.`);
    }
    printSeparator();
  }

  console.log('🎉 Execution Finished!');
  console.log('Please check your Facebook Developer Console to verify the calls were recorded.');
}

run();
