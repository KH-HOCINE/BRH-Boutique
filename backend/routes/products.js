const express = require('express');
const multer  = require('multer');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { storage, cloudinary } = require('../config/cloudinary');
const router  = express.Router();

// ── Configuration Multer (upload vers Cloudinary) ─────────────
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Seules les images sont acceptées'));
  },
});

// ── Routes publiques ──────────────────────────────────────────

// GET /api/products — tous les produits disponibles
router.get('/', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    const filter = { isAvailable: true };

    if (category) filter.category = category;
    if (featured) filter.isFeatured = true;

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { anime: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/admin/all — tous les produits (admin)
// ⚠️ Cette route doit être AVANT /:id pour ne pas être interceptée
router.get('/admin/all', protect, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Routes admin (protégées) ──────────────────────────────────

// POST /api/products — créer un produit
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name, description, priceChild, priceAdult, category,
      sizes, fits, colors, stock, isFeatured, anime,
    } = req.body;

    // f.path contient l'URL Cloudinary complète (https://res.cloudinary.com/...)
    const images = req.files ? req.files.map(f => f.path) : [];

    const product = await Product.create({
      name,
      description,
      priceChild:  Number(priceChild),
      priceAdult:  Number(priceAdult),
      category,
      anime:       anime  ? anime.trim() : '',
      sizes:       sizes  ? JSON.parse(sizes)  : [],
      fits:        fits   ? JSON.parse(fits)   : [],
      colors:      colors ? JSON.parse(colors) : [],
      stock:       stock || 0,
      isFeatured:  isFeatured === 'true',
      images,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name, description, priceChild, priceAdult, category,
      sizes, fits, colors, stock, isFeatured, isAvailable, anime,
    } = req.body;

    const update = {
      name,
      description,
      priceChild:  Number(priceChild),
      priceAdult:  Number(priceAdult),
      category,
      anime:       anime  ? anime.trim() : '',
      sizes:       sizes  ? JSON.parse(sizes)  : [],
      fits:        fits   ? JSON.parse(fits)   : [],
      colors:      colors ? JSON.parse(colors) : [],
      stock,
      isFeatured:  isFeatured  === 'true',
      isAvailable: isAvailable !== 'false',
    };

    if (req.files && req.files.length > 0) {
      // Supprimer les anciennes images Cloudinary avant de sauvegarder les nouvelles
      const existing = await Product.findById(req.params.id);
      if (existing?.images?.length) {
        for (const url of existing.images) {
          // Extraire le public_id depuis l'URL Cloudinary
          // ex: https://res.cloudinary.com/demo/image/upload/v123/boutique-produits/abc.jpg
          const parts = url.split('/');
          const filenameWithExt = parts[parts.length - 1];
          const folder = parts[parts.length - 2];
          const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (e) {
            console.warn('Impossible de supprimer l\'image Cloudinary :', publicId);
          }
        }
      }

      update.images = req.files.map(f => f.path);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable' });

    // Supprimer les images Cloudinary associées
    if (product.images?.length) {
      for (const url of product.images) {
        const parts = url.split('/');
        const filenameWithExt = parts[parts.length - 1];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.warn('Impossible de supprimer l\'image Cloudinary :', publicId);
        }
      }
    }

    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;