const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const expressRateLimit = require('express-rate-limit');
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

// Default rate limiting middleware
const defaultLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later."
});
const rateLimiters = new Map();


// Create dynamic proxy route
function createProxyRoute(targetUrl, rateLimitValue) {
    let customLimiter = rateLimiters.get(targetUrl);
    
    if (!customLimiter) {
      customLimiter = expressRateLimit({
        windowMs: 15 * 60 * 1000,
        max: rateLimitValue || 100,
        message: "Rate limit exceeded"
      });
      rateLimiters.set(targetUrl, customLimiter);
    }
  
    return [
      customLimiter,
      async (req, res, next) => {
        // Update request count in database
        await ApiConfig.findOneAndUpdate(
          { originalUrl: targetUrl },
          { $inc: { requestCount: 1 } }
        );
        next();
      },
      createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: {
          [`^/proxy/${encodeURIComponent(targetUrl)}`]: '',
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log(`Proxying request to: ${targetUrl}${req.url}`);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log(`Received response from: ${targetUrl}${req.url}`);
        },
        onError: (err, req, res) => {
          console.error('Proxy Error:', err);
          res.status(500).send('Proxy Error');
        }
      })
    ];
  }


// API to create new proxy
app.post('/api/create-proxy', async (req, res) => {
    const { targetUrl, rateLimit } = req.body;
    if (!targetUrl) {
      return res.status(400).json({ message: 'Target URL is required' });
    }
  
    const proxyPath = `/proxy/${encodeURIComponent(targetUrl)}`;
  
    // Check if the route already exists
    if (!app._router.stack.some(layer => layer.regexp.test(proxyPath))) {
      app.use(proxyPath, ...createProxyRoute(targetUrl, rateLimit));
    }
  
    const newConfig = new ApiConfig({
      originalUrl: targetUrl,
      proxyUrl: `http://localhost:8080${proxyPath}`,
      rateLimit: rateLimit || 100
    });
    await newConfig.save();
    res.json({ proxyUrl: newConfig.proxyUrl });
  });



// API to get stats
app.get('/api/stats/:id', async (req, res) => {
  const config = await ApiConfig.findById(req.params.id);
  if (!config) {
    return res.status(404).json({ message: 'Config not found' });
  }
  res.json({ requestCount: config.requestCount, rateLimit: config.rateLimit });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});