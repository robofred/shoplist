const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON and enable CORS
app.use(express.json());
app.use(cors());

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create table if it doesn't exist
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        item TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        list TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database table initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// POST endpoint to add items
app.post('/api/items', async (req, res) => {
  const { item, quantity, list } = req.body;

  // Validate payload
  if (!item || typeof quantity !== 'number' || !list) {
    return res.status(400).json({ error: 'Missing or invalid fields: item (string), quantity (number), list (string) are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO items (item, quantity, list) VALUES ($1, $2, $3) RETURNING *',
      [item, quantity, list]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server and initialize database
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await initializeDatabase();
});
