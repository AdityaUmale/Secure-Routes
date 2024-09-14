const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ApiConfig = require('./models/ApiConfig');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/secureRoutes');
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Simple in-memory rate limiter
const rateLimiter = new Map();

function simpleRateLimiter(limit, windowMs) {
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!rateLimiter.has(ip)) {
            rateLimiter.set(ip, []);
        }

        const requests = rateLimiter.get(ip);
        const recentRequests = requests.filter(time => time > windowStart);

        if (recentRequests.length >= limit) {
            return res.status(429).json({ message: 'Too many requests' });
        }

        recentRequests.push(now);
        rateLimiter.set(ip, recentRequests);

        next();
    };
}

// Modify the createProxyRoute function
function createProxyRoute(targetUrl, rateLimit) {
    console.log("Creating proxy route for:", targetUrl);
    const parsedUrl = new URL(targetUrl);

    return [
        simpleRateLimiter(rateLimit, 15 * 60 * 1000), // 15 minutes window
        (req, res, next) => {
            console.log("Proxy middleware hit:", req.method, req.url);
            next();
        },
        createProxyMiddleware({
            target: `${parsedUrl.protocol}//${parsedUrl.host}`,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                console.log("Original path:", path);
                const newPath = path.replace(/^\/proxy\/[^/]+/, '');
                console.log("Rewritten path:", newPath);
                return newPath;
            },
            onProxyReq: (proxyReq, req, res) => {
                console.log(`Proxying request to: ${parsedUrl.protocol}//${parsedUrl.host}${req.url}`);
            },
            onProxyRes: (proxyRes, req, res) => {
                console.log(`Received response from: ${parsedUrl.protocol}//${parsedUrl.host}${req.url}`);
            },
            onError: (err, req, res) => {
                console.error('Proxy Error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Proxy Error' });
                }
            }
        })
    ];
}

// Middleware to update request count
app.use('/proxy', async (req, res, next) => {
    console.log("Request count middleware hit:", req.method, req.url);
    const path = req.url.split('/')[1];  // Get the hostname part
    const config = await ApiConfig.findOne({ 'proxyUrl': { $regex: path } });
    if (config) {
        await ApiConfig.findByIdAndUpdate(config._id, { $inc: { requestCount: 1 } });
    }
    next();
});

// API to create new proxy
app.post('/api/create-proxy', async (req, res) => {
    let { targetUrl, rateLimit } = req.body;
    if (!targetUrl) {
        return res.status(400).json({ message: 'Target URL is required' });
    }
    
    targetUrl = targetUrl.trim();
    console.log("Creating proxy for:", targetUrl);

    try {
        const parsedUrl = new URL(targetUrl);

        const proxyPath = `/proxy/${parsedUrl.hostname}`;
        console.log("Proxy path:", proxyPath);

        // Check if a route with this path already exists
        const existingConfig = await ApiConfig.findOne({ proxyUrl: new RegExp(proxyPath) });
        if (existingConfig) {
            return res.json({ proxyUrl: existingConfig.proxyUrl, id: existingConfig._id });
        }

        // Create the new route
        app.use(proxyPath, ...createProxyRoute(targetUrl, rateLimit || 100));

        const newConfig = new ApiConfig({
            originalUrl: targetUrl,
            proxyUrl: `http://localhost:8080${proxyPath}${parsedUrl.pathname}`,
            rateLimit: rateLimit || 100
        });
        await newConfig.save();
        console.log("Proxy URL created:", newConfig.proxyUrl);
        res.json({ proxyUrl: newConfig.proxyUrl, id: newConfig._id });
    } catch (error) {
        console.error("Error creating proxy:", error);
        res.status(500).json({ message: 'Error creating proxy', error: error.message });
    }
});

// API to get stats
app.get('/api/stats/:id', async (req, res) => {
  try {
    const config = await ApiConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'Config not found' });
    }
    res.json({ requestCount: config.requestCount, rateLimit: config.rateLimit });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Catch-all route for unhandled requests
app.use((req, res, next) => {
    console.log("Unhandled request:", req.method, req.url);
    next();
});

// Add a global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).send('Something went wrong');
});

// API to update rate limit
app.put('/api/update-rate-limit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rateLimit } = req.body;
        const updatedProxy = await ApiConfig.findByIdAndUpdate(id, { rateLimit }, { new: true });
        if (!updatedProxy) {
            return res.status(404).json({ message: 'Proxy not found' });
        }
        res.json(updatedProxy);
    } catch (error) {
        console.error('Error updating rate limit:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API to fetch all proxies
app.get('/api/proxies', async (req, res) => {
    try {
        const proxies = await ApiConfig.find();
        console.log("Proxies:", proxies);
        res.json(proxies);
    } catch (error) {
        console.error('Error fetching proxies:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});