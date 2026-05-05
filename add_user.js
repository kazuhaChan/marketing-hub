const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const addUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'nddung2609@gmail.com';
    const password = 'admin';
    const role = 'Poster';
    const username = 'nddung2609';

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists. Updating password and role...');
      user.password = password; // The pre-save hook will hash it
      user.role = role;
      await user.save();
      console.log('User updated successfully.');
    } else {
      user = new User({ username, email, password, role });
      await user.save();
      console.log('User created successfully.');
    }
  } catch (err) {
    console.error('Error adding user:', err);
  } finally {
    mongoose.disconnect();
  }
};

addUser();
