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
      console.log('User already exists. Updating password and role to Poster...');
      user.password = 'kaiyovietnam';
      user.role = 'Poster';
      await user.save();
      console.log('User updated successfully.');
    } else {
      user = new User({
        username: 'Admin Poster', 
        email: 'nddung2609@gmail.com',
        password: 'kaiyovietnam',
        role: 'Poster'
      });
      await user.save();
      console.log('Poster account created successfully.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
  }
};

initAdmin();
