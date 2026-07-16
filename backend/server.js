// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

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
    // Autoriser les requêtes sans Origin (Postman, curl...)
    if (!origin) {
      return callback(null, true);
    }

    // Autoriser localhost
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Autoriser toutes les previews Vercel
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

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
// Route de test
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🛍️ API Boutique Mode — opérationnelle',
  });
});

// ─────────────────────────────────────────────
// Connexion MongoDB
// ─────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    });
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

// ─────────────────────────────────────────────
// Gestion des promesses non capturées
// ─────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});