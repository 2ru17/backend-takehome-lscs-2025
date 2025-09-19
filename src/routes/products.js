const express = require('express');
const { pool } = require('../db/connection');

// Create a new router    
const router = express.Router();

// Validation helper
const validateProduct = (raw, isUpdate = false) => {
  const errors = [];
  const data = { ...raw };

  // Normalize boolean-like is_active if present
  if (data.is_active !== undefined) {
    if (typeof data.is_active === 'string') {
      const lowered = data.is_active.toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(lowered)) data.is_active = true;
      else if (['false', '0', 'no', 'n'].includes(lowered)) data.is_active = false;
    } else if (typeof data.is_active === 'number') {
      data.is_active = data.is_active === 1;
    }
    // After normalization enforce boolean
    if (typeof data.is_active !== 'boolean') {
      errors.push('is_active must be boolean');
    }
  }

  // Common checks
  if (!isUpdate) {
    if (!data.name || data.name.trim().length === 0) errors.push('Product name is required');
    if (data.price === undefined || data.price === null || data.price === '') {
      errors.push('Product price is required and must be greater than 0');
    }
  } else {
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) errors.push('Product name cannot be empty');
  }

  // Numeric validations
  if (data.price !== undefined) {
    if (typeof data.price === 'string' && data.price.trim() !== '') {
      const parsed = Number(data.price);
      if (!Number.isNaN(parsed)) data.price = parsed;
    }
    if (typeof data.price !== 'number' || Number.isNaN(data.price)) {
      errors.push('Product price must be a number');
    } else if (data.price <= 0) {
      errors.push('Product price must be greater than 0');
    }
  }

  if (data.quantity !== undefined) {
    if (typeof data.quantity === 'string' && data.quantity.trim() !== '') {
      const parsedQ = Number(data.quantity);
      if (!Number.isNaN(parsedQ)) data.quantity = parsedQ;
    }
    if (!Number.isInteger(data.quantity) || data.quantity < 0) {
      errors.push('Product quantity must be a non-negative integer');
    }
  }

  if (data.name && data.name.length > 255) errors.push('Product name is too long (maximum 255 characters)');

  return { errors, data };
};

// Whitelisted fields for create/update
const ALLOWED_FIELDS = new Set(['name', 'description', 'sku', 'price', 'quantity', 'category', 'is_active']);

// POST /products - Create a new product
// This endpoint allows you to add a new product to the database
router.post('/', async (req, res) => {
  try {
    // Filter only allowed fields
    const filtered = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED_FIELDS.has(k)));
    const { errors, data } = validateProduct(filtered);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }
    const {
      name,
      description = '',
      sku = null,
      price,
      quantity = 0,
      category = null,
      is_active = true,
    } = data;

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
        details: ['SKU must be unique'],
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
    const filtered = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED_FIELDS.has(k)));
    const { errors, data } = validateProduct(filtered, true);
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
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
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
        details: ['SKU must be unique'],
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
