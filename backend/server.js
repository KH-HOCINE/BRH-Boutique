// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression'); // npm i compression
require('dotenv').config();

const app = express();

// ─────────────────────────────────────────────
// Compression Gzip (réponses JSON + images passées par le proxy plus légères)
// ─────────────────────────────────────────────
app.use(compression());

// ─────────────────────────────────────────────
// Configuration CORS
// ─────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://brh-boutique.vercel.app',
  'https://brhboutique.store',
  'https://www.brhboutique.store',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error(`Origin non autorisée : ${origin}`));
  },
  credentials: true,
}));

// ─────────────────────────────────────────────
// Middlewares
// ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/meta', require('./routes/meta'));
app.use('/api/anderson', require('./routes/anderson'));
app.use('/api/upload', require('./routes/upload'));

// ─────────────────────────────────────────────
// Route de test / health check (utilisée pour le "réveil" du serveur)
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🛍️ API Boutique Mode — opérationnelle',
  });
});

app.get('/api/health', (req, res) => res.status(200).send('ok'));

// ─────────────────────────────────────────────
// Connexion MongoDB
// ─────────────────────────────────────────────
mongoose.set('strictQuery', true);

mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10, // réutilise les connexions au lieu d'en recréer
})
  .then(() => {
    console.log('✅ MongoDB connecté');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    });

    // ── Auto-ping toutes les 10 min pour éviter la mise en veille ──
    // (n'a d'effet que si SELF_URL est défini dans les variables d'env,
    // ex: SELF_URL=https://ton-backend.onrender.com)
    if (process.env.SELF_URL) {
      setInterval(() => {
        fetch(`${process.env.SELF_URL}/api/health`).catch(() => {});
      }, 10 * 60 * 1000);
    }
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  });

// ─────────────────────────────────────────────
// Gestion globale des erreurs
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ ERREUR :', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Erreur serveur',
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});