'use strict';

const express = require('express');
const path    = require('path');
const helmet  = require('helmet');
const apiRoutes = require('./routes');

// In Docker the ENV var points to /app/public (built React dist).
// In local dev without Docker it falls back to the Vite build output.
const FRONTEND_DIR =
  process.env.FRONTEND_DIR ||
  path.join(__dirname, '../../frontend-react/dist');

function createApp(controllers) {
  const app = express();

  /* ── Security headers ──────────────────────────────────── */
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        // socket.io is now bundled by Vite — no CDN required
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        fontSrc:     ["'self'", 'fonts.gstatic.com'],
        connectSrc:  ["'self'", 'ws:', 'wss:'],
        imgSrc:      ["'self'", 'data:'],
      }
    },
    crossOriginEmbedderPolicy: false   // Socket.IO needs this off
  }));

  /* ── Body parsing — cap at 50 KB to prevent DoS ───────── */
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  /* ── Static files ──────────────────────────────────────── */
  app.use(express.static(FRONTEND_DIR));

  /* ── API routes ────────────────────────────────────────── */
  app.use('/api', apiRoutes(controllers));

  /* ── SPA fallback — serve index.html for all non-API GETs  */
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });

  /* ── 404 handler ───────────────────────────────────────── */
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
  });

  /* ── Global error handler ──────────────────────────────── */
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('🔥 Unhandled error:', err.message);
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? 'Internal server error' : err.message
    });
  });

  return app;
}

module.exports = createApp;
