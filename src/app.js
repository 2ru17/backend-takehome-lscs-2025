// Import required packages
const express = require('express'); // Web framework for Node.js
require('dotenv').config(); // Load environment variables from .env file

// Import our product routes
const productRoutes = require('./routes/products');

// Create Express app
const app = express();

// Get port from environment variables or use 3000 as default
const PORT = process.env.PORT || 3000;

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
// All product-related routes will start with /products
app.use('/products', productRoutes);

// Handle requests to routes that don't exist
// This catches any request that doesn't match our defined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

// Start the server
// This makes our API available at http://localhost:3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Export the app so it can be tested
module.exports = app;