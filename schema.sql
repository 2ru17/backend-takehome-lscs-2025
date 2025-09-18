-- Products API Database Schema
-- This file creates the products table with all required fields

CREATE DATABASE IF NOT EXISTS products_api;
USE products_api;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  quantity INT NOT NULL DEFAULT 0,
  category VARCHAR(100),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some sample data for testing
INSERT INTO products (name, description, sku, price, quantity, category, is_active) VALUES
('Mechanical Keyboard', 'Blue switches, RGB backlight', 'KB-001', 129.99, 10, 'Peripherals', 1),
('Wireless Mouse', 'Ergonomic design, 2.4GHz wireless', 'MS-001', 49.99, 25, 'Peripherals', 1),
('USB-C Hub', '7-in-1 hub with HDMI, USB 3.0, SD card slots', 'HB-001', 79.99, 15, 'Accessories', 1);