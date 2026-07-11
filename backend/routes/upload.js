// routes/upload.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const router = express.Router();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Seules les images sont acceptées'));
  },
});

// POST /api/upload/design
router.post('/design', upload.single('design'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu' });
    }
    // req.file.path contient l'URL Cloudinary complète
    res.json({ url: req.file.path });
  } catch (err) {
    console.error('Upload design error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;