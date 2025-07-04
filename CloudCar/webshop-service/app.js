const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');

// Cache Service URL
const CACHE_SERVICE_URL = process.env.CACHE_SERVICE_URL || 'http://shopping-cache-service:3001';

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // <--- IMPORTANT: Ensure this is present for parsing JSON requests
app.use(session({
    secret: 'supersecret', // In production: configure via ENV!
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    // res.setHeader('Content-Type', 'text/html; charset=utf-8'); // This can be removed or explicitly set before res.render
    next();
});

// MySQL Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10
});

// Helper function to get multiple video URLs from cache service
async function getVideoUrlsForProducts(productIds) {
    if (!Array.isArray(productIds) || productIds.length === 0) return {};

    try {
        const response = await fetch(`${CACHE_SERVICE_URL}/api/videos/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productIds })
        });

        if (response.ok) {
            const data = await response.json();
            return data.videos || {};
        } else {
            console.error('Cache service batch error:', response.status);
            return {};
        }
    } catch (error) {
        console.error('Error fetching video URLs from cache service:', error);
        return {};
    }
}

// API endpoint to manually clear video cache (proxied to cache service)
app.post('/api/cache/clear-videos', async (req, res) => {
    try {
        const response = await fetch(`${CACHE_SERVICE_URL}/api/cache/clear-videos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        if (response.ok) {
            const data = await response.json();
            res.json(data);
        } else {
            res.status(response.status).json({ error: 'Cache service error' });
        }
    } catch (error) {
        console.error('Error proxying cache clear request:', error);
        res.status(500).json({ error: 'Failed to clear video cache' });
    }
});

// Helper function to get total cart quantity from cache service
async function getTotalCartQuantity(sessionId) {
    try {
        const response = await fetch(`${CACHE_SERVICE_URL}/api/cart/${sessionId}`);
        if (response.ok) {
            const data = await response.json();
            return data.totalQuantity || 0;
        }
    } catch (error) {
        console.error('Error getting cart quantity from cache service:', error);
    }
    return 0;
}

// Helper function to get cart items from cache service
async function getCartItems(sessionId) {
    try {
        const response = await fetch(`${CACHE_SERVICE_URL}/api/cart/${sessionId}`);
        if (response.ok) {
            const data = await response.json();
            return data.items || [];
        }
    } catch (error) {
        console.error('Error getting cart items from cache service:', error);
    }
    return [];
}

// API endpoint for currency exchange rates
app.get('/api/exchange-rates', async (req, res) => {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const data = await response.json();

        // Select relevant currencies for the merchandise shop
        const relevantCurrencies = {
            EUR: 1.0000, // 1 Euro = 1 Euro (Base currency - all other rates relative to 1 EUR)
            USD: data.rates.USD,
            GBP: data.rates.GBP,
            CHF: data.rates.CHF,
            JPY: data.rates.JPY,
            CAD: data.rates.CAD
        };

        res.json({
            base: 'EUR',
            rates: relevantCurrencies,
            lastUpdate: data.date
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Wechselkurse:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Wechselkurse' });
    }
});


// Startseite
app.get('/', async (req, res) => {
    try {
        const totalCartQuantity = await getTotalCartQuantity(req.sessionID);

        // Check cache service for cached products first
        try {
            const cacheResponse = await fetch(`${CACHE_SERVICE_URL}/api/cache/products`);
            if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                if (cacheData.cached && cacheData.products) {
                    console.log('Product list cache hit from cache service');
                    return res.render('index', { products: cacheData.products, totalCartQuantity });
                }
            }
        } catch (cacheError) {
            console.log('Cache service not available, continuing without cache:', cacheError.message);
        }

        console.log('Loading products from database...');
        const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');

        // Load video URLs for products that have them
        console.log('Loading video URLs for products...');
        const productsWithVideos = products.filter(p => p.video_url);
        const productIds = productsWithVideos.map(p => p.id);

        if (productIds.length > 0) {
            const videoUrls = await getVideoUrlsForProducts(productIds);

            // Assign video URLs to products
            for (let product of products) {
                if (product.video_url && videoUrls[product.id]) {
                    product.youtube_url = videoUrls[product.id];
                }
            }
        }

        // Cache the complete product list with video URLs via cache service
        try {
            await fetch(`${CACHE_SERVICE_URL}/api/cache/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ products })
            });
            console.log('Product list cached via cache service');
        } catch (cacheError) {
            console.log('Failed to cache product list via cache service:', cacheError.message);
        }

        res.render('index', { products, totalCartQuantity });
    } catch (err) {
        console.error('Fehler beim Laden:', err);
        res.status(500).send('Fehler beim Laden');
    }
});



// Produkt zum Warenkorb hinzufügen (AJAX-Response)
app.post('/cart/add', async (req, res) => {
    const productId = parseInt(req.body.productId);
    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Ungültige Produkt-ID' });
    }

    try {
        // Add product via cache service
        const response = await fetch(`${CACHE_SERVICE_URL}/api/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productId,
                sessionId: req.sessionID
            })
        });

        if (response.ok) {
            const cacheData = await response.json();

            // Get product name from database
            const [productResult] = await pool.query('SELECT name FROM products WHERE id = ?', [productId]);
            const productName = productResult[0]?.name || 'Produkt';

            res.status(200).json({
                message: 'Produkt zum Warenkorb hinzugefügt!',
                productName,
                productId,
                totalCartQuantity: cacheData.totalCartQuantity,
                itemsCount: cacheData.itemsCount
            });
        } else {
            const errorData = await response.json();
            console.error('Cache service error:', errorData);
            res.status(500).json({ message: 'Fehler beim Hinzufügen des Produkts zum Warenkorb' });
        }
    } catch (err) {
        console.error('Fehler beim Hinzufügen zum Warenkorb:', err);
        res.status(500).json({ message: 'Fehler beim Hinzufügen des Produkts zum Warenkorb' });
    }
});


// ... (Rest Ihrer app.js, z.B. /cart, /cart/remove, /cart/update bleibt unverändert)
app.get('/cart', async (req, res) => {
    try {
        // Get cart items from cache service
        const cartItems = await getCartItems(req.sessionID);

        if (cartItems.length === 0) {
            return res.render('cart', { items: [], total: 0, totalQuantity: 0 });
        }

        // Get product details from database
        const productIds = cartItems.map(item => item.productId);
        const [products] = await pool.query(
            `SELECT * FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
            productIds
        );

        // Combine cart items with product details
        const items = products.map(product => {
            const cartItem = cartItems.find(item => item.productId === product.id);
            return {
                ...product,
                quantity: cartItem ? cartItem.quantity : 0
            };
        });

        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        res.render('cart', { items, total, totalQuantity });
    } catch (err) {
        console.error('Fehler beim Laden des Warenkorbs:', err);
        res.status(500).send('Fehler beim Anzeigen des Warenkorbs');
    }
});

app.post('/cart/remove', async (req, res) => {
    const productId = parseInt(req.body.productId || req.body.product_id);
    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Ungültige Produkt-ID' });
    }

    try {
        // Remove product via cache service
        const response = await fetch(`${CACHE_SERVICE_URL}/api/cart/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productId,
                sessionId: req.sessionID
            })
        });

        if (response.ok) {
            const cacheData = await response.json();

            // Calculate total amount by getting product prices
            let totalAmount = 0;
            if (cacheData.itemsCount > 0) {
                const cartItems = await getCartItems(req.sessionID);
                if (cartItems.length > 0) {
                    const productIds = cartItems.map(item => item.productId);
                    const [products] = await pool.query(
                        `SELECT id, price FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
                        productIds
                    );

                    totalAmount = products.reduce((sum, product) => {
                        const cartItem = cartItems.find(item => item.productId === product.id);
                        return sum + (product.price * (cartItem ? cartItem.quantity : 0));
                    }, 0);
                }
            }

            res.status(200).json({
                message: 'Produkt erfolgreich entfernt',
                totalQuantity: cacheData.totalQuantity,
                totalAmount: totalAmount.toFixed(2),
                removedProductId: productId,
                itemsCount: cacheData.itemsCount
            });
        } else {
            const errorData = await response.json();
            console.error('Cache service error:', errorData);
            res.status(500).json({ message: 'Fehler beim Entfernen des Produkts' });
        }
    } catch (err) {
        console.error('Fehler beim Entfernen aus dem Warenkorb:', err);
        res.status(500).json({ message: 'Fehler beim Entfernen des Produkts' });
    }
});


app.post('/cart/update', async (req, res) => {
    const productId = parseInt(req.body.productId);
    const action = req.body.action;

    if (isNaN(productId) || !['increase', 'decrease'].includes(action)) {
        return res.status(400).json({ message: 'Ungültige Anfrage' });
    }

    try {
        // Update product quantity via cache service
        const response = await fetch(`${CACHE_SERVICE_URL}/api/cart/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productId,
                action: action,
                sessionId: req.sessionID
            })
        });

        if (response.ok) {
            const cacheData = await response.json();

            // Get product price for subtotal calculation
            const [priceRow] = await pool.query('SELECT price FROM products WHERE id = ?', [productId]);
            const productPrice = priceRow[0]?.price || 0;
            const newSubtotal = productPrice * cacheData.updatedQuantity;

            // Calculate total amount
            let totalAmount = 0;
            if (cacheData.itemsCount > 0) {
                const cartItems = await getCartItems(req.sessionID);
                if (cartItems.length > 0) {
                    const productIds = cartItems.map(item => item.productId);
                    const [products] = await pool.query(
                        `SELECT id, price FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
                        productIds
                    );

                    totalAmount = products.reduce((sum, product) => {
                        const cartItem = cartItems.find(item => item.productId === product.id);
                        return sum + (product.price * (cartItem ? cartItem.quantity : 0));
                    }, 0);
                }
            }

            res.status(200).json({
                productId,
                updatedQuantity: cacheData.updatedQuantity,
                newSubtotal: newSubtotal.toFixed(2),
                totalQuantity: cacheData.totalQuantity,
                totalAmount: totalAmount.toFixed(2),
                itemsCount: cacheData.itemsCount
            });
        } else {
            const errorData = await response.json();

            if (response.status === 404 && errorData.productRemoved) {
                // Handle product not found case
                let totalAmount = 0;
                if (errorData.itemsCount > 0) {
                    const cartItems = await getCartItems(req.sessionID);
                    if (cartItems.length > 0) {
                        const productIds = cartItems.map(item => item.productId);
                        const [products] = await pool.query(
                            `SELECT id, price FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
                            productIds
                        );

                        totalAmount = products.reduce((sum, product) => {
                            const cartItem = cartItems.find(item => item.productId === product.id);
                            return sum + (product.price * (cartItem ? cartItem.quantity : 0));
                        }, 0);
                    }
                }

                return res.status(404).json({
                    message: 'Product not found in cart. Cart has been updated.',
                    totalQuantity: errorData.totalQuantity,
                    totalAmount: totalAmount.toFixed(2),
                    productRemoved: true,
                    productId,
                    itemsCount: errorData.itemsCount
                });
            }

            console.error('Cache service error:', errorData);
            res.status(500).json({ message: 'Error updating quantity' });
        }
    } catch (err) {
        console.error('Error updating quantity:', err);
        res.status(500).json({ message: 'Error updating quantity' });
    }
});



// Server-Start
async function startServer() {
    try {
        const port = process.env.APP_PORT || 8080;
        app.listen(port, () => {
            console.log(`Webshop Service running on http://localhost:${port}`);
            console.log(`Cache Service URL: ${CACHE_SERVICE_URL}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

startServer();