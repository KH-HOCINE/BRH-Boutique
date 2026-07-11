const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Le nom du produit est requis'],
    trim:     true,
  },
  description: {
    type:    String,
    default: '',
  },
  priceChild: {
    type:     Number,
    required: [true, 'Le prix enfant est requis'],
    min:      0,
  },
  priceAdult: {
    type:     Number,
    required: [true, 'Le prix adulte est requis'],
    min:      0,
  },
  category: {
    type:     String,
    required: true,
    enum:     ['T-shirt', 'Hoodie', 'Sac à dos', 'Ensemble'],
  },
  anime: {
    type:    String,
    default: '',
    trim:    true,
  },
  sizes: [{
    type: String,
    enum: ['6ans','8ans','10ans','12ans','14ans/Xs','S','M','L','XL','XXL'],
  }],
  fits: [{
    type: String,
    enum: ['Oversize', 'Regularsize'],
  }],
  colors: [{ type: String }],
  // Les images stockent désormais des URLs Cloudinary complètes
  // ex: https://res.cloudinary.com/ton-cloud/image/upload/v123/boutique-produits/abc.webp
  images: [{ type: String }],
  stock: {
    type:    Number,
    default: 0,
    min:     0,
  },
  isAvailable: {
    type:    Boolean,
    default: true,
  },
  isFeatured: {
    type:    Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);