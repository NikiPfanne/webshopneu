const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database setup
const dbPath = path.join(__dirname, '../database/wellness.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with schema
const fs = require('fs');
const initSQL = fs.readFileSync(path.join(__dirname, '../database/init.sql'), 'utf8');

db.exec(initSQL, (err) => {
    if (err) {
        console.error('Error initializing database:', err);
    } else {
        console.log('Database initialized successfully');
    }
});

// API Routes

// Get all categories
app.get('/api/categories', (req, res) => {
    const query = `
        SELECT c.*, 
               COUNT(s.id) as service_count
        FROM categories c
        LEFT JOIN services s ON c.id = s.category_id AND s.status = 'enabled'
        WHERE c.status = 'enabled'
        GROUP BY c.id
        ORDER BY c.sort_order, c.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get category by ID with services
app.get('/api/categories/:id', (req, res) => {
    const categoryId = req.params.id;
    
    const categoryQuery = `
        SELECT * FROM categories 
        WHERE id = ? AND status = 'enabled'
    `;
    
    const servicesQuery = `
        SELECT * FROM services 
        WHERE category_id = ? AND status = 'enabled'
        ORDER BY sort_order, name
    `;
    
    db.get(categoryQuery, [categoryId], (err, category) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!category) {
            res.status(404).json({ error: 'Category not found' });
            return;
        }
        
        db.all(servicesQuery, [categoryId], (err, services) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                ...category,
                services: services
            });
        });
    });
});

// Get all services
app.get('/api/services', (req, res) => {
    const query = `
        SELECT s.*, c.name as category_name, c.seo_url as category_url
        FROM services s
        JOIN categories c ON s.category_id = c.id
        WHERE s.status = 'enabled' AND c.status = 'enabled'
        ORDER BY c.sort_order, s.sort_order, s.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get service by ID
app.get('/api/services/:id', (req, res) => {
    const serviceId = req.params.id;
    
    const query = `
        SELECT s.*, c.name as category_name, c.seo_url as category_url
        FROM services s
        JOIN categories c ON s.category_id = c.id
        WHERE s.id = ? AND s.status = 'enabled' AND c.status = 'enabled'
    `;
    
    db.get(query, [serviceId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        
        res.json(row);
    });
});

// Get service by SEO URL
app.get('/api/services/url/:seoUrl', (req, res) => {
    const seoUrl = req.params.seoUrl;
    
    const query = `
        SELECT s.*, c.name as category_name, c.seo_url as category_url
        FROM services s
        JOIN categories c ON s.category_id = c.id
        WHERE s.seo_url = ? AND s.status = 'enabled' AND c.status = 'enabled'
    `;
    
    db.get(query, [seoUrl], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Service not found' });
            return;
        }
        
        res.json(row);
    });
});

// Get services by category SEO URL
app.get('/api/categories/url/:seoUrl/services', (req, res) => {
    const seoUrl = req.params.seoUrl;
    
    const query = `
        SELECT s.*, c.name as category_name, c.seo_url as category_url
        FROM services s
        JOIN categories c ON s.category_id = c.id
        WHERE c.seo_url = ? AND s.status = 'enabled' AND c.status = 'enabled'
        ORDER BY s.sort_order, s.name
    `;
    
    db.all(query, [seoUrl], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/service/:seoUrl', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/service.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Wellness Website Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});