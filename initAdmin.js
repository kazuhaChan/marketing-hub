const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const initAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check if exists
    let user = await User.findOne({ email: 'nddung2609@gmail.com' });
    if (user) {
      console.log('User already exists. Updating password and role to Admin...');
      user.password = 'kaiyovietnam';
      user.role = 'Admin';
      await user.save();
      console.log('User updated to Admin successfully.');
    } else {
      user = new User({
        username: 'Admin', 
        email: 'nddung2609@gmail.com',
        password: 'kaiyovietnam',
        role: 'Admin'
      });
      await user.save();
      console.log('Admin account created successfully.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
  }
};

initAdmin();
