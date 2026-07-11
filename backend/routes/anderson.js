// routes/anderson.js

const express = require('express');
const router  = express.Router();
const { andersonRequest } = require('../config/anderson');

const CACHE_TTL = 60 * 60 * 1000; // 1 heure

// ── Cache wilayas ────────────────────────────────────────────
let wilayasCache = null;
let wilayasCacheTime = null;

async function getWilayas() {
  if (wilayasCache && wilayasCacheTime && (Date.now() - wilayasCacheTime) < CACHE_TTL) {
    return wilayasCache;
  }
  const data = await andersonRequest('/api/v1/get/wilayas');
  wilayasCache = Array.isArray(data) ? data : [];
  wilayasCacheTime = Date.now();
  console.log(`[Anderson] ✅ Wilayas chargées : ${wilayasCache.length}`);
  return wilayasCache;
}

// ── Cache communes (toutes, filtrées ensuite en mémoire) ────
let communesCache = null;
let communesCacheTime = null;

async function getAllCommunes() {
  if (communesCache && communesCacheTime && (Date.now() - communesCacheTime) < CACHE_TTL) {
    return communesCache;
  }
  const data = await andersonRequest('/api/v1/get/communes');
  // La réponse peut être un objet indexé {"0": {...}, "1": {...}} ou un tableau direct
  const list = Array.isArray(data) ? data : Object.values(data || {});
  communesCache = list;
  communesCacheTime = Date.now();
  console.log(`[Anderson] ✅ Communes chargées : ${communesCache.length}`);
  return communesCache;
}

// ── Cache tarifs ─────────────────────────────────────────────
let feesCache = null;
let feesCacheTime = null;

async function getFees() {
  if (feesCache && feesCacheTime && (Date.now() - feesCacheTime) < CACHE_TTL) {
    return feesCache;
  }
  const data = await andersonRequest('/api/v1/get/fees');
  feesCache = data;
  feesCacheTime = Date.now();
  return data;
}

// GET /api/anderson/wilayas
router.get('/wilayas', async (req, res) => {
  try {
    const wilayas = await getWilayas();
    const items = wilayas
      .map(w => ({ id: Number(w.wilaya_id), name: w.wilaya_name }))
      .sort((a, b) => a.id - b.id);
    res.json({ items });
  } catch (err) {
    console.error('[Anderson] Wilayas error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/anderson/communes?wilayaId=16
router.get('/communes', async (req, res) => {
  try {
    const { wilayaId } = req.query;
    if (!wilayaId) return res.status(400).json({ message: 'wilayaId requis' });

    const all = await getAllCommunes();
    const filtered = all
      .filter(c => Number(c.wilaya_id) === Number(wilayaId))
      .map(c => ({
        name: c.nom,
        postalCode: c.code_postal,
        hasStopDesk: !!c.has_stop_desk,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    res.json({ items: filtered });
  } catch (err) {
    console.error('[Anderson] Communes error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/anderson/fees — tarifs bruts
router.get('/fees', async (req, res) => {
  try {
    const fees = await getFees();
    res.json(fees);
  } catch (err) {
    console.error('[Anderson] Fees error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/anderson/delivery-price?wilayaId=16&type=home|office
router.get('/delivery-price', async (req, res) => {
  try {
    const { wilayaId, type = 'home' } = req.query;
    if (!wilayaId) return res.status(400).json({ message: 'wilayaId requis' });

    const fees  = await getFees();
    const entry = (fees.livraison || []).find(f => Number(f.wilaya_id) === Number(wilayaId));
    if (!entry) return res.status(404).json({ message: 'Wilaya non desservie par Anderson Express' });

    const price = type === 'office'
      ? Number(entry.tarif_stopdesk)
      : Number(entry.tarif);

    res.json({ wilayaId: Number(wilayaId), type, price });
  } catch (err) {
    console.error('[Anderson] Delivery-price error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/anderson/refresh — vider tous les caches
router.post('/refresh', async (req, res) => {
  wilayasCache = null; wilayasCacheTime = null;
  communesCache = null; communesCacheTime = null;
  feesCache = null; feesCacheTime = null;
  try {
    const [wilayas, communes, fees] = await Promise.all([getWilayas(), getAllCommunes(), getFees()]);
    res.json({
      message: `Cache rechargé : ${wilayas.length} wilayas, ${communes.length} communes, ${(fees.livraison || []).length} tarifs`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;