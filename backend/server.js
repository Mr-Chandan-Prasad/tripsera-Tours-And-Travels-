const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// MySQL Database Configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'tripsera_db',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MySQL API is running' });
});

// Generic CRUD operations for all tables
const tables = ['destinations', 'services', 'bookings', 'gallery', 'testimonials', 'advertisements', 'offers', 'inquiries', 'site_settings'];

tables.forEach(table => {
  // GET all records
  app.get(`/api/${table}`, async (req, res) => {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${table} ORDER BY created_at DESC`);
      res.json(rows);
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      res.status(500).json({ error: `Failed to fetch ${table}` });
    }
  });

  // GET single record by ID
  app.get(`/api/${table}/:id`, async (req, res) => {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: `${table} not found` });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      res.status(500).json({ error: `Failed to fetch ${table}` });
    }
  });

  // POST create new record
  app.post(`/api/${table}`, async (req, res) => {
    try {
      const data = req.body;
      const columns = Object.keys(data).join(', ');
      const values = Object.values(data);
      const placeholders = values.map(() => '?').join(', ');

      const [result] = await pool.execute(
        `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
        values
      );

      const [newRecord] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [result.insertId]);
      res.status(201).json(newRecord[0]);
    } catch (error) {
      console.error(`Error creating ${table}:`, error);
      res.status(500).json({ error: `Failed to create ${table}` });
    }
  });

  // PUT update record
  app.put(`/api/${table}/:id`, async (req, res) => {
    try {
      const data = req.body;
      const columns = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), req.params.id];

      await pool.execute(
        `UPDATE ${table} SET ${columns} WHERE id = ?`,
        values
      );

      const [updatedRecord] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json(updatedRecord[0]);
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      res.status(500).json({ error: `Failed to update ${table}` });
    }
  });

  // DELETE record
  app.delete(`/api/${table}/:id`, async (req, res) => {
    try {
      await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting ${table}:`, error);
      res.status(500).json({ error: `Failed to delete ${table}` });
    }
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MySQL API server running on port ${PORT}`);
  console.log(`📊 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});
