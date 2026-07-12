// models/Order.js

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
    default: null,
  },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size:     { type: String, default: '' },
  fit:      { type: String, default: '' },
  color:    { type: String, default: '' },
  image:    { type: String, default: '' },

  // ✅ Tableau des designs importés avec leur position EXACTE
  // Format : { side: 'front'|'back', url, x, y, w, h } (en %)
  // Mixed = accepte aussi l'ancien format (simple string) pour compatibilité
  designImages: { type: [mongoose.Schema.Types.Mixed], default: [] },

  // ✅ NOUVEAU : note libre du client sur les détails de son design
  designNote: { type: String, default: '' },

  custom:   { type: Boolean, default: false },
  note:     { type: String, default: '' },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
  },
  customer: {
    fullName:  { type: String, required: true },
    phone:     { type: String, required: true },
    phone2:    { type: String, default: '' },
    email:     { type: String, default: '' },
    wilaya:    { type: String, required: true },
    wilayaCode: { type: Number, required: false },
    commune:   { type: String, required: true },
    address:   { type: String, default: '' },
    deliveryType: {
      type: String,
      enum: ['home', 'office'],
      default: 'home'
    },
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
  },
  deliveryPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'],
    default: 'En attente',
  },
  notes: {
    type: String,
    default: '',
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  andersonOrderId: {
    type: String,
    default: null,
  },
  andersonSyncStatus: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending',
  },
}, { timestamps: true });

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `CMD-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);