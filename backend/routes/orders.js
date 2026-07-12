// routes/orders.js
const express = require('express');
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');
const { sendOrderNotificationToAdmin, sendOrderConfirmationToClient } = require('../config/email');
const { createAndersonOrder } = require('../config/anderson');
const router  = express.Router();

// POST /api/orders — passer une commande (public)
router.post('/', async (req, res) => {
  try {
    const { customer, items, notes, deliveryPrice } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Panier vide' });
    }

    const cleanedItems = items.map(item => {
      const isValidObjectId = /^[a-f\d]{24}$/i.test(item.product);
      return { ...item, product: isValidObjectId ? item.product : null };
    });

    const subtotal    = cleanedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery    = deliveryPrice || 0;
    const totalAmount = subtotal + delivery;

    const order = await Order.create({
      customer, items: cleanedItems, subtotal,
      deliveryPrice: delivery, totalAmount, notes,
    });

    // ── Synchronisation avec Anderson Express ──
    let syncError = null;
    try {
      const andersonResponse = await createAndersonOrder(order);
      order.andersonOrderId = andersonResponse.id || andersonResponse.orderId || 'synced_ok';
      order.andersonSyncStatus = 'synced';
      console.log(`[Sync] ✅ Commande ${order.orderNumber} synchronisée sur Anderson.`);
    } catch (err) {
      syncError = err;
      order.andersonSyncStatus = 'failed';
      console.error(`[Sync] ❌ Échec sync Anderson pour ${order.orderNumber} :`, err.message);
    }
    await order.save();

    // ── Envoi des emails ──
    const hasRealProducts = cleanedItems.some(i => i.product !== null);
    if (hasRealProducts) await order.populate('items.product', 'name images');

    try {
      await sendOrderNotificationToAdmin(order);
      await sendOrderConfirmationToClient(order);
      order.notificationSent = true;
      await order.save();
    } catch (emailErr) {
      console.error('⚠️ Email non envoyé :', emailErr.message);
    }

    res.status(201).json({
      message: 'Commande passée avec succès !',
      orderNumber: order.orderNumber,
      orderId: order._id,
      andersonSync: syncError ? 'failed' : 'success',
    });
  } catch (err) {
    console.error('Erreur POST /orders:', err);
    res.status(400).json({ message: err.message });
  }
});

// GET /api/orders/track/:orderNumber — suivi public
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() });
    if (!order) return res.status(404).json({ message: 'Commande introuvable. Vérifiez le numéro.' });

    res.json({
      orderNumber:   order.orderNumber,
      status:        order.status,
      createdAt:     order.createdAt,
      subtotal:      order.subtotal,
      deliveryPrice: order.deliveryPrice,
      totalAmount:   order.totalAmount,
      notes:         order.notes,
      items: order.items.map(item => ({
        name: item.name, price: item.price, quantity: item.quantity,
        size: item.size, fit: item.fit, color: item.color,
        image: item.image, custom: item.custom, note: item.note,
        designImages: item.designImages, designNote: item.designNote,
      })),
      customer: {
        wilaya: order.customer.wilaya,
        commune: order.customer.commune,
        deliveryType: order.customer.deliveryType,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders — toutes les commandes (admin)
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/stats/summary — stats dashboard
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const total     = await Order.countDocuments();
    const pending   = await Order.countDocuments({ status: 'En attente' });
    const confirmed = await Order.countDocuments({ status: 'Confirmée' });
    const delivered = await Order.countDocuments({ status: 'Livrée' });
    const revenue   = await Order.aggregate([
      { $match: { status: { $ne: 'Annulée' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    res.json({ total, pending, confirmed, delivered, revenue: revenue[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id (admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/status — changer le statut (admin)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/orders/:id — modifier une commande complète (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const { customer, items, notes, deliveryPrice, status } = req.body;

    const updateFields = {};

    if (customer) {
      const allowed = ['fullName', 'phone', 'phone2', 'email', 'wilaya', 'wilayaCode', 'commune', 'address', 'deliveryType'];
      allowed.forEach(field => {
        if (customer[field] !== undefined) {
          updateFields[`customer.${field}`] = customer[field];
        }
      });
    }

    if (items !== undefined) {
      const cleanedItems = items.map(item => {
        const isValidObjectId = /^[a-f\d]{24}$/i.test(item.product);
        return {
          product:  isValidObjectId ? item.product : null,
          name:     item.name,
          price:    Number(item.price)    || 0,
          quantity: Number(item.quantity) || 1,
          size:     item.size  || '',
          fit:      item.fit   || '',
          color:    item.color || '',
          image:    item.image || '',
          // ✅ On préserve les designs (position exacte) et la note client
          designImages: item.designImages || [],
          designNote:   item.designNote   || '',
          custom:   item.custom || false,
          note:     item.note  || '',
        };
      });

      const subtotal    = cleanedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const delivery    = deliveryPrice !== undefined ? Number(deliveryPrice) : undefined;
      const totalAmount = subtotal + (delivery !== undefined ? delivery : 0);

      updateFields.items        = cleanedItems;
      updateFields.subtotal     = subtotal;
      updateFields.totalAmount  = totalAmount;
      if (delivery !== undefined) updateFields.deliveryPrice = delivery;
    } else if (deliveryPrice !== undefined) {
      updateFields.deliveryPrice = Number(deliveryPrice);
      const existing = await Order.findById(req.params.id).select('subtotal');
      if (existing) updateFields.totalAmount = existing.subtotal + Number(deliveryPrice);
    }

    if (notes    !== undefined) updateFields.notes  = notes;
    if (status)                 updateFields.status = status;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  } catch (err) {
    console.error('PUT /orders/:id error:', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/orders/:id — supprimer une commande (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json({ message: 'Commande supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;