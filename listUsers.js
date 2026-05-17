const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const listUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({});
    console.log('\n=== ALL REGISTERED USERS ===');
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((u, i) => {
        console.log(`${i + 1}. [${u.role}] Username: ${u.username} | Email: ${u.email}`);
        console.log(`   Password (Hashed/Encrypted): ${u.password}\n`);
      });
    }
    console.log('============================\n');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
  }
};

listUsers();
