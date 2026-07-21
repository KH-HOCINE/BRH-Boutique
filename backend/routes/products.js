const express = require('express');
const multer  = require('multer');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { storage, cloudinary } = require('../config/cloudinary');
const router  = express.Router();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Seules les images sont acceptées'));
  },
});

// ── Mini cache en mémoire pour la liste "featured" (change rarement) ──
let featuredCache = { data: null, expiresAt: 0 };
const FEATURED_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Routes publiques ──────────────────────────────────────────

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, featured } = req.query;

    // Sert depuis le cache si on demande juste les produits vedettes
    if (featured === 'true' && !category && !search) {
      const now = Date.now();
      if (featuredCache.data && featuredCache.expiresAt > now) {
        res.set('Cache-Control', 'public, max-age=60');
        return res.json(featuredCache.data);
      }
    }

    const filter = { isAvailable: true };
    if (category) filter.category = category;
    if (featured) filter.isFeatured = true;
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { anime: { $regex: search, $options: 'i' } },
      ];
    }

    // .lean() = objets JS bruts au lieu de documents Mongoose complets → beaucoup plus rapide
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    if (featured === 'true' && !category && !search) {
      featuredCache = { data: products, expiresAt: Date.now() + FEATURED_TTL_MS };
    }

    res.set('Cache-Control', 'public, max-age=60'); // cache 60s côté navigateur/CDN
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/admin/all — protégé, doit rester AVANT /:id
router.get('/admin/all', protect, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: 'Produit introuvable' });
    res.set('Cache-Control', 'public, max-age=60');
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Routes admin (protégées) ──────────────────────────────────

function invalidateFeaturedCache() {
  featuredCache = { data: null, expiresAt: 0 };
}

// POST /api/products
router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name, description, priceChild, priceAdult, category,
      sizes, fits, colors, stock, isFeatured, anime,
    } = req.body;

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

    invalidateFeaturedCache();
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
      const existing = await Product.findById(req.params.id);
      if (existing?.images?.length) {
        for (const url of existing.images) {
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

    invalidateFeaturedCache();
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

    invalidateFeaturedCache();
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;