const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const postRoutes = require('./routes/posts');
const socialRoutes = require('./routes/social');
const orderRoutes = require('./routes/orders');
const initCron = require('./cron');
const path = require('path');
require('dotenv').config();

// Connect to database
connectDB();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/orders', orderRoutes);

// Initialize Cron Jobs
initCron();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
