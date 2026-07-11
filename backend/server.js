// server.js

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/meta',        require('./routes/meta'));
app.use('/api/anderson',    require('./routes/anderson'));
app.use('/api/upload',      require('./routes/upload'));

// ── Route de test ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🛍️ API Boutique Mode — opérationnelle' });
});

// ── Connexion MongoDB ─────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  });

// ── Gestion des erreurs globales ──────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ ERREUR GLOBALE:', err.stack || err.message || err);
  res.status(500).json({ message: err.message || 'Erreur serveur' });
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});