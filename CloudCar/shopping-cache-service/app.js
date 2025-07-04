const express = require('express');
const redis = require('redis');
const { Client } = require('minio');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Redis Client
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
});

// MinIO Client
const url = new URL(process.env.MINIO_ENDPOINT || 'http://minio:9000');
const minioClient = new Client({
    endPoint: url.hostname,
    port: parseInt(url.port),
    useSSL: url.protocol === 'https:',
    accessKey: process.env.MINIO_ROOT_USER,
    secretKey: process.env.MINIO_ROOT_PASSWORD,
});

// Helper function to convert YouTube URLs to iframe-friendly embed URLs
function convertToEmbedUrl(youtubeUrl) {
    if (!youtubeUrl) return null;

    // Extract video ID from different YouTube URL formats
    let videoId = null;

    // Handle youtu.be links
    const youtubeShortRegex = /youtu\.be\/([a-zA-Z0-9_-]+)/;
    const shortMatch = youtubeUrl.match(youtubeShortRegex);
    if (shortMatch) {
        videoId = shortMatch[1];
    }

    // Handle youtube.com/watch links
    const youtubeLongRegex = /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
    const longMatch = youtubeUrl.match(youtubeLongRegex);
    if (longMatch) {
        videoId = longMatch[1];
    }

    // Handle youtube.com/embed links (already in correct format)
    const embedRegex = /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/;
    const embedMatch = youtubeUrl.match(embedRegex);
    if (embedMatch) {
        return youtubeUrl; // Already in embed format
    }

    if (videoId) {
        // Use youtube-nocookie.com for better privacy and less blocking
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;
    }

    return null;
}

// API endpoint to get video URL by product ID
app.get('/api/video/:productId', async (req, res) => {
    const productId = req.params.productId;

    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
        // Check cache first
        const cacheKey = `video_url_${productId}`;
        const cachedUrl = await redisClient.get(cacheKey);

        if (cachedUrl) {
            console.log(`Video URL cache hit for product ${productId}`);
            const videoUrl = cachedUrl === 'null' ? null : cachedUrl;
            return res.json({
                productId,
                videoUrl,
                cached: true,
                source: 'cache'
            });
        }

        let videoUrl = null;

        // Try to get from centralized JSON first
        try {
            const jsonCacheKey = 'videos_json_mappings';
            let videoMappings;

            // Check if JSON mappings are cached
            const cachedMappings = await redisClient.get(jsonCacheKey);
            if (cachedMappings) {
                videoMappings = JSON.parse(cachedMappings);
                console.log('Video mappings cache hit');
            } else {
                // Load from MinIO and cache
                console.log('Loading videos.json from MinIO...');
                const stream = await minioClient.getObject('videos', 'videos.json');
                let data = '';
                for await (const chunk of stream) {
                    data += chunk;
                }
                videoMappings = JSON.parse(data);

                // Cache the mappings for 10 minutes
                await redisClient.setEx(jsonCacheKey, 600, JSON.stringify(videoMappings));
                console.log('Video mappings cached for 10 minutes');
            }

            // Try structured format: { "1": { "id": 1, "name": "...", "video_url": "..." } }
            let rawUrl = null;
            const productEntry = videoMappings[productId];

            if (productEntry && typeof productEntry === 'object' && productEntry.video_url !== undefined) {
                rawUrl = productEntry.video_url;
                if (rawUrl) {
                    console.log(`Found video for product ${productId} (${productEntry.name}): ${rawUrl}`);
                } else {
                    console.log(`Product ${productId} (${productEntry.name}) has no video URL`);
                }
            }

            if (rawUrl) {
                videoUrl = convertToEmbedUrl(rawUrl);
            }
        } catch (jsonError) {
            console.log('No videos.json found or product not in JSON, trying individual file');
        }

        // Fallback to individual file if not found in JSON
        if (!videoUrl) {
            try {
                const filename = `product${productId}.txt`;
                const stream = await minioClient.getObject('videos', filename);
                let data = '';
                for await (const chunk of stream) {
                    data += chunk;
                }
                const youtubeUrl = data.trim();
                videoUrl = convertToEmbedUrl(youtubeUrl);
            } catch (fileError) {
                console.log(`No individual video file found for product ${productId}`);
                videoUrl = null;
            }
        }

        // Cache the result (including null results to avoid repeated failures)
        const cacheValue = videoUrl || 'null';
        await redisClient.setEx(cacheKey, 21600, cacheValue); // 6 hours cache
        console.log(`Video URL cached for product ${productId}: ${videoUrl ? 'found' : 'not found'}`);

        res.json({
            productId,
            videoUrl,
            cached: false,
            source: videoUrl ? 'minio' : 'not_found'
        });
    } catch (error) {
        console.error('Error loading video URL for product:', productId, error);

        // Cache negative result to avoid repeated failures
        try {
            await redisClient.setEx(cacheKey, 1800, 'null'); // 30 minutes cache for errors
        } catch (cacheError) {
            console.log('Redis cache write error for negative result:', cacheError);
        }

        res.status(500).json({ error: 'Failed to load video URL' });
    }
});

// API endpoint to get multiple video URLs
app.post('/api/videos/batch', async (req, res) => {
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
        return res.status(400).json({ error: 'productIds must be an array' });
    }

    try {
        const results = {};

        for (const productId of productIds) {
            // Make internal API call to reuse existing logic
            try {
                const response = await fetch(`http://localhost:${process.env.CACHE_PORT || 3001}/api/video/${productId}`);
                const data = await response.json();
                results[productId] = data.videoUrl;
            } catch (error) {
                console.error(`Error fetching video for product ${productId}:`, error);
                results[productId] = null;
            }
        }

        res.json({ videos: results });
    } catch (error) {
        console.error('Error in batch video fetch:', error);
        res.status(500).json({ error: 'Failed to fetch video URLs' });
    }
});

// API endpoint to cache product list
app.post('/api/cache/products', async (req, res) => {
    const { products } = req.body;

    if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'products must be an array' });
    }

    try {
        await redisClient.setEx('product_list_with_videos', 600, JSON.stringify(products));
        console.log('Product list cached for 10 minutes');

        res.json({
            success: true,
            message: 'Product list cached successfully',
            ttl: 600
        });
    } catch (error) {
        console.error('Error caching product list:', error);
        res.status(500).json({ error: 'Failed to cache product list' });
    }
});

// API endpoint to get cached product list
app.get('/api/cache/products', async (req, res) => {
    try {
        const cached = await redisClient.get('product_list_with_videos');

        if (cached) {
            console.log('Product list cache hit');
            const products = JSON.parse(cached);
            return res.json({
                products,
                cached: true,
                source: 'cache'
            });
        }

        res.json({
            products: null,
            cached: false,
            source: 'not_cached'
        });
    } catch (error) {
        console.error('Error fetching cached product list:', error);
        res.status(500).json({ error: 'Failed to fetch cached product list' });
    }
});

// API endpoint to clear video caches
app.post('/api/cache/clear-videos', async (req, res) => {
    try {
        const { productId } = req.body;

        if (productId) {
            // Clear specific product video cache
            await redisClient.del(`video_url_${productId}`);
            console.log(`Cleared video cache for product ${productId}`);

            res.json({
                success: true,
                message: `Cleared cache for product ${productId}`
            });
        } else {
            // Clear all video-related caches
            const keys = await redisClient.keys('video_url_*');
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            await redisClient.del('videos_json_mappings');
            await redisClient.del('product_list_with_videos');
            console.log('Cleared all video caches');

            res.json({
                success: true,
                message: 'Cleared all video caches'
            });
        }
    } catch (error) {
        console.error('Error clearing video cache:', error);
        res.status(500).json({ error: 'Failed to clear video cache' });
    }
});

// ========== CART MANAGEMENT ENDPOINTS ==========

// Helper function: Get cart key for session
function getCartKey(sessionId) {
    return `cart_items:${sessionId}`;
}

// Helper function: Get total cart quantity
async function getTotalCartQuantity(sessionId) {
    const cartKey = getCartKey(sessionId);
    const items = await redisClient.hGetAll(cartKey);
    return Object.values(items).reduce((sum, qty) => sum + parseInt(qty, 10), 0);
}

// API endpoint to add product to cart
app.post('/api/cart/add', async (req, res) => {
    const { productId, sessionId } = req.body;

    if (!productId || !sessionId) {
        return res.status(400).json({ error: 'productId and sessionId are required' });
    }

    try {
        const cartKey = getCartKey(sessionId);
        const currentQty = parseInt(await redisClient.hGet(cartKey, productId.toString()) || '0', 10);
        await redisClient.hSet(cartKey, productId.toString(), (currentQty + 1).toString());

        const newTotalCartQuantity = await getTotalCartQuantity(sessionId);
        const items = await redisClient.hGetAll(cartKey);

        console.log(`Added product ${productId} to cart for session ${sessionId}`);

        res.json({
            success: true,
            productId: parseInt(productId),
            totalCartQuantity: newTotalCartQuantity,
            itemsCount: Object.keys(items).length
        });
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ error: 'Failed to add product to cart' });
    }
});

// API endpoint to get cart items
app.get('/api/cart/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    try {
        const cartKey = getCartKey(sessionId);
        const items = await redisClient.hGetAll(cartKey);

        const cartItems = Object.entries(items).map(([productId, quantity]) => ({
            productId: parseInt(productId),
            quantity: parseInt(quantity, 10)
        }));

        const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            items: cartItems,
            totalQuantity,
            itemsCount: cartItems.length
        });
    } catch (error) {
        console.error('Error getting cart items:', error);
        res.status(500).json({ error: 'Failed to get cart items' });
    }
});

// API endpoint to remove product from cart
app.post('/api/cart/remove', async (req, res) => {
    const { productId, sessionId } = req.body;

    if (!productId || !sessionId) {
        return res.status(400).json({ error: 'productId and sessionId are required' });
    }

    try {
        const cartKey = getCartKey(sessionId);
        await redisClient.hDel(cartKey, productId.toString());

        const items = await redisClient.hGetAll(cartKey);
        const totalQuantity = Object.values(items).reduce((sum, qty) => sum + parseInt(qty, 10), 0);

        console.log(`Removed product ${productId} from cart for session ${sessionId}`);

        res.json({
            success: true,
            removedProductId: parseInt(productId),
            totalQuantity,
            itemsCount: Object.keys(items).length
        });
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ error: 'Failed to remove product from cart' });
    }
});

// API endpoint to update product quantity in cart
app.post('/api/cart/update', async (req, res) => {
    const { productId, action, sessionId } = req.body;

    if (!productId || !action || !sessionId || !['increase', 'decrease'].includes(action)) {
        return res.status(400).json({ error: 'productId, action (increase/decrease), and sessionId are required' });
    }

    try {
        const cartKey = getCartKey(sessionId);
        let currentQty = parseInt(await redisClient.hGet(cartKey, productId.toString()) || '0', 10);

        if (currentQty === 0) {
            const items = await redisClient.hGetAll(cartKey);
            const totalQuantity = Object.values(items).reduce((sum, qty) => sum + parseInt(qty, 10), 0);

            return res.status(404).json({
                error: 'Product not found in cart',
                productRemoved: true,
                productId: parseInt(productId),
                totalQuantity,
                itemsCount: Object.keys(items).length
            });
        }

        let newQuantity = currentQty;
        if (action === 'increase') {
            newQuantity += 1;
            await redisClient.hSet(cartKey, productId.toString(), newQuantity.toString());
        } else if (action === 'decrease') {
            if (newQuantity <= 1) {
                await redisClient.hDel(cartKey, productId.toString());
                newQuantity = 0;
            } else {
                newQuantity -= 1;
                await redisClient.hSet(cartKey, productId.toString(), newQuantity.toString());
            }
        }

        const items = await redisClient.hGetAll(cartKey);
        const totalQuantity = Object.values(items).reduce((sum, qty) => sum + parseInt(qty, 10), 0);

        console.log(`Updated product ${productId} quantity to ${newQuantity} for session ${sessionId}`);

        res.json({
            success: true,
            productId: parseInt(productId),
            updatedQuantity: newQuantity,
            totalQuantity,
            itemsCount: Object.keys(items).length
        });
    } catch (error) {
        console.error('Error updating cart quantity:', error);
        res.status(500).json({ error: 'Failed to update cart quantity' });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await redisClient.ping();
        res.json({
            status: 'healthy',
            services: {
                redis: 'connected',
                minio: 'configured'
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Server-Start
async function startServer() {
    try {
        await redisClient.connect();
        console.log('Redis connected');

        const port = process.env.CACHE_PORT || 3001;
        app.listen(port, () => {
            console.log(`Shopping Cache Service running on http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Error starting cache service:', err);
        process.exit(1);
    }
}

startServer();
