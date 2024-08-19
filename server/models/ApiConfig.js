const mongoose = require('mongoose');

const ApiConfigSchema = new mongoose.Schema({
  originalUrl: String,
  proxyUrl: String,
  rateLimit: Number,
  requestCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.AoiConfig ?? mongoose.model('ApiConfig', ApiConfigSchema);