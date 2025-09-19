# Products API (Take‑Home Challenge)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js >=18](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org/)
[![MySQL >=8](https://img.shields.io/badge/MySQL-%3E%3D8.0-orange)](https://www.mysql.com/)

A lightweight, extensible **RESTful API** for managing products, built with **Node.js**, **Express**, and **MySQL**. It implements full CRUD with input validation. Created as a 2025 backend take‑home challenge for LSCS.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Sample Requests](#sample-requests)
9. [Error Format](#error-format)
10. [Development Notes](#development-notes)
11. [Roadmap](#roadmap)
12. [License](#license)
13. [Author](#author)

---

## Features

- Create, retrieve (list / single), update, delete products
- Field-level validation (name length, positive price, non-negative quantity, unique `sku`)
- Graceful 404 + structured error responses
- Auto-managed timestamps (`created_at`, `updated_at`)
- Flexible partial updates (only send fields you want to change)
- Environment-driven configuration (`.env`)

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Runtime    | Node.js (>=18) |
| Framework  | Express |
| Database   | MySQL 8.x |
| Driver     | `mysql2/promise` |
| Config     | `dotenv` |

---

## Project Structure

```text
├── schema.sql                # Database + table + seed data
├── src
│   ├── app.js                
│   ├── db
│   │   └── connection.js     
│   └── routes
│       └── products.js       # /products CRUD endpoints
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MySQL 8.x running locally (or remote instance)
- A MySQL user with privileges to create databases / tables

### 1. Clone

```bash
git clone https://github.com/2ru17/backend-takehome-lscs-2025.git
cd backend-takehome-lscs-2025
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file (see [Environment Variables](#environment-variables)).

### 4. Initialize Database

Run the SQL schema (creates database + table + seed rows):

```bash
mysql -u <DB_USER> -p < schema.sql
```
If your MySQL user cannot create databases, manually create one and remove the `CREATE DATABASE` line.

### 5. Start Server

```bash
node src/app.js
```
Server listens on `http://localhost:<PORT>` (default `3000`).
---

## Environment Variables

Create `.env` in the project root:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=products_api
```

All variables have fallbacks (see `connection.js`) but supplying them is recommended.

---

## Database Schema

Simplified excerpt (see full in `schema.sql`):

```sql
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
```

---

## API Reference

Base URL (local): `http://localhost:3000`

| Method | Path | Purpose | Body Fields (selected) |
|--------|------|---------|------------------------|
| POST   | `/products` | Create product (201 Created) | `name*`, `price*`, `description?`, `sku?`, `quantity?`, `category?`, `is_active?` |
| GET    | `/products` | List all products (newest first) | — |
| GET    | `/products/:id` | Fetch single product | — |
| PUT    | `/products/:id` | Partial/Full update (only sent fields applied) | Any subset of creatable fields |
| DELETE | `/products/:id` | Remove product | — |

Field notes:

- `price` must be > 0
- `quantity` must be >= 0
- `sku` must be unique (duplicate insert/update yields 400)
- `is_active` is boolean-like (1/0 / true/false accepted via JS layer)

Update behavior:

- Only whitelisted fields are applied on create/update: `name, description, sku, price, quantity, category, is_active`.
- Unknown keys in the payload are ignored (not persisted).
- Partial updates accepted (omit fields to leave unchanged).

---

## Sample Requests

Create:

```bash
curl -X POST http://localhost:3000/products \
   -H "Content-Type: application/json" \
   -d '{
      "name": "USB-C Hub",
      "sku": "HB-002",
      "price": 69.99,
      "quantity": 5,
      "category": "Accessories"
   }'
```

List:

```bash
curl http://localhost:3000/products
```

Get One:

```bash
curl http://localhost:3000/products/1
```

Update (partial):

```bash
curl -X PUT http://localhost:3000/products/1 \
   -H "Content-Type: application/json" \
   -d '{ "price": 119.99, "quantity": 12 }'
```

Delete:

```bash
curl -X DELETE http://localhost:3000/products/1
```

---

## Sample Response (Create)

```json
{
   "id": 4,
   "name": "USB-C Hub",
   "description": "",
   "sku": "HB-002",
   "price": 69.99,
   "quantity": 5,
   "category": "Accessories",
   "is_active": 1,
   "created_at": "2025-09-19T10:15:23.000Z",
   "updated_at": "2025-09-19T10:15:23.000Z"
}
```

---

## Error Format

Errors follow a consistent JSON shape:

```json
{
   "error": "Validation failed",
   "details": ["Product price must be greater than 0"]
}
```

Other examples:

```json
{ "error": "Product not found" }
{ "error": "Route not found" }
```

| Status | Scenario |
|--------|----------|
| 400 | Validation failure / malformed ID |
| 404 | Missing resource / unknown route |
| 500 | Unhandled server/database error |

Notes:

- Duplicate SKU returns: `{ "error": "Validation failed", "details": ["SKU must be unique"] }`.
- Validation includes numeric type and non-negative integer checks for `quantity`.

---

## TODO

- Test scripts
- Make proper validation library using Zod or Joi later
- Lint configuration


---

## License

Released under the [MIT License](LICENSE).

---

## Author

2ru17
