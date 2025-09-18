// Import MySQL database driver
const mysql = require('mysql2/promise');

// Load environment variables from .env file
require('dotenv').config();

// Database configuration
// hese settings tell our app how to connect to the MySQL database
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',     // Database server address
  port: process.env.DB_PORT || 3306,           // Database port (MySQL default is 3306)
  user: process.env.DB_USER || 'root',         // Database username
  password: process.env.DB_PASSWORD || 'password', // Database password
  database: process.env.DB_NAME || 'products_api', // Database name
  decimalNumbers: true,
};

// A pool manages multiple database connections automatically
const pool = mysql.createPool(dbConfig);

// Export the pool so other files can use it to query the database
module.exports = { pool };
