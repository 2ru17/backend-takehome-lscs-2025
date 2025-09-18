# backend-takehome-lscs-2025

A RESTful API built with **Node.js**, **Express.js**, and **MySQL** to manage a collection of products.  
It supports full **CRUD** (Create, Read, Update, Delete) operations and was developed as a take-home challenge.

---

## Features

- **Create Product**: Add a new product to the database.  
- **Read Products**: Retrieve a list of all products or a single product by its unique ID.  
- **Update Product**: Modify the details of an existing product.  
- **Delete Product**: Remove a product from the database.  
- **Data Validation**: Ensures data integrity with server-side validation.  
- **Error Handling**: Returns appropriate HTTP status codes and informative JSON responses.  

---

## Technology Stack

- **Backend**: Node.js, Express.js  
- **Database**: MySQL  
- **Dependencies**:  
  - `express` – Web framework for Node.js  
  - `mysql2` – MySQL client for Node.js  
  - `dotenv` – Environment variable management  

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)  
- [MySQL](https://www.mysql.com/)  
- A MySQL client (e.g., MySQL Workbench, DBeaver)  

---

## Setup and Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/2ru17/backend-takehome-lscs-2025.git
   cd /backend-takehome-lscs-2025.git

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Database setup**

   * Create a new MySQL database.
   * Execute the `schema.sql` file to create the `products` table.

4. **Environment variables**
   Create a `.env` file in the root directory and configure it with your database credentials:

   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database_name
   ```

5. **Run the application**

   ```bash
   node app.js
   ```
   or do
   
   ```bash
   npm start
   ```

   By default, the server starts on **port 3000** (can be configurable).

---

## API Endpoints

All responses are returned in **JSON** format.

| Method | Endpoint        | Description                      | Request Body Example                    |
| ------ | --------------- | -------------------------------- | --------------------------------------- |
| POST   | `/products`     | Creates a new product            | `{ "name": "Laptop", "price": 999.99 }` |
| GET    | `/products`     | Retrieves all products           | -                                    |
| GET    | `/products/:id` | Retrieves a single product by ID | -                                    |
| PUT    | `/products/:id` | Updates product details by ID    | `{ "name": "Tablet", "price": 499.99 }` |
| DELETE | `/products/:id` | Deletes a product by ID          | -                                    |

---

## Product Data Model

Each product has the following attributes:

* `id`: **INTEGER**, Primary Key, Auto Increment
* `name`: **vARCHAR(255)**, Not Null
* `price`: **DECIMAL(10, 2)**, Not Null
* `[additional_attributes]`: TBA

---

## Author

**2ru17**
