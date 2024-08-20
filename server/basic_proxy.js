const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/proxy/localhost', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  logLevel: 'debug', // Enable debug logging for detailed output
}));

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
