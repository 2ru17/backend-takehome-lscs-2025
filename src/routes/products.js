const express = require('express');
const { pool } = require('../db/connection');

// Create a new router    
const router = express.Router();

// Simple validation function to check product data
// This function checks if the product data is valid before saving to database
const validateProduct = (data, isUpdate = false) => {
  const errors = [];
  
  // For new products, name and price are required
  if (!isUpdate) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    }
    if (data.price === undefined || data.price === null || data.price === '') {
      errors.push('Product price is required and must be greater than 0');
    } else if (data.price <= 0) {
      errors.push('Product price must be greater than 0');
    }
  } else {
    // For updates, only validate provided fields
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      errors.push('Product name cannot be empty');
    }
    if (data.price !== undefined && data.price <= 0) {
      errors.push('Product price must be greater than 0');
    }
  }
  
  // Check name length 
  if (data.name && data.name.length > 255) {
    errors.push('Product name is too long (maximum 255 characters)');
  }
  
  // Check iff
  if (data.quantity !== undefined && data.quantity < 0) {
    errors.push('Product quantity cannot be negative');
  }
  
  return errors;
};

// POST /products - Create a new product
// This endpoint allows you to add a new product to the database
router.post('/', async (req, res) => {
  try {
    // First, check if the data is valid
    const errors = validateProduct(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // Get the product data from the request body
    // Set default values for optional fields
    const {
      name,
      description = '',  // Empty string if not provided
      sku = null,        // null if not provided  
      price,
      quantity = 0,      // Default to 0 if not provided
      category = null,   // null if not provided
      is_active = true,  // Default to active
    } = req.body;

    // SQL query to insert the new product into the database
    const query = `
      INSERT INTO products (name, description, sku, price, quantity, category, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the insert query with the product data
    const [result] = await pool.execute(query, [name, description, sku, price, quantity, category, is_active]);
    
    // Get the newly created product to return it
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    
    // Return the created product with status 201 (Created)
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['sku already exists'],
      });
    }
      console.error('Error creating product:', error);
      
    res.status(500).json({
      error: 'Something went wrong while creating the product',
    });
  }
});

// GET /products - Get all products
// This endpoint returns a list of all products in the database
router.get('/', async (req, res) => {
  try {
    // Newest first
    const [rows] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
    
    // this gi
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error getting products:', error);

    res.status(500).json({
      error: 'Something went wrong while getting the products',
    });
  }
});

// GET /products/:id - Get a single product by its ID
// This endpoint returns one specific product using its ID number
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        error: 'Product ID must be a positive number',
      });
    }

    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    
    // if no product found, return 404 
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error getting product:', error);
    
    res.status(500).json({
      error: 'Something went wrong while getting the product',
    });
  }
});

// PUT /products/:id - Update an existing product
// This endpoint allows you to modify a product's information
router.put('/:id', async (req, res) => {
  try {
    
    const { id } = req.params;
    
    
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        error: 'Product ID must be a positive number',
      });
    }

    // Validate the new data (isUpdate = true means name/price not required)
    const errors = validateProduct(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // First, check if the product exists
    const [existingRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    // Build the SQL query based on what fields are being updated
    const fields = [];  // Will store field names like "name = ?"
    const values = [];  // Will store the new values

    // Go through each field in the request and add it to the update
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    // If no fields to update, just return the existing product
    if (fields.length === 0) {
      return res.status(200).json(existingRows[0]);
    }

    // Add the ID to the end of the values array for the WHERE 
    values.push(id);
    
    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;

    await pool.execute(query, values);
    
    // Get the updated product to return it
    const [updatedRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    
    
    res.status(200).json(updatedRows[0]);
  } catch (error) {
    // Handle duplicate SKU error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['SKU already exists - please use a different SKU'],
      });
    }
    
    console.error('Error updating product:', error);
    
    res.status(500).json({
      error: 'Something went wrong while updating the product',
    });
  }
});

// DELETE /products/:id - Delete a product from the database
// This endpoint permanently removes a product
router.delete('/:id', async (req, res) => {
  try {
    
    const { id } = req.params;
    
    
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        error: 'Product ID must be a positive number',
      });
    }

    // First, check if the product exists
    const [existingRows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    // Delete the product from the database
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    
    
    res.status(200).json({
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    
    console.error('Error deleting product:', error);
    
    res.status(500).json({
      error: 'Something went wrong while deleting the product',
    });
  }
});

module.exports = router;
