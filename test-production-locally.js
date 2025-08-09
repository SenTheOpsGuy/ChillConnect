const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Proxy API calls to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  }
}));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🌐 Production simulation running on http://localhost:${PORT}`);
  console.log(`📱 Frontend: Serving React app`);
  console.log(`🔗 Backend API: Proxying to http://localhost:5001`);
  console.log(`🧪 Test the full system at http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down production test server...');
  process.exit(0);
});