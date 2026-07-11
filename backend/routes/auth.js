const express = require('express');
const jwt     = require('jsonwebtoken');
const Admin   = require('../models/Admin');
const { protect } = require('../middleware/auth');
const router  = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email et mot de passe requis' });

  const admin = await Admin.findOne({ email });
  if (!admin || !(await admin.comparePassword(password)))
    return res.status(401).json({ message: 'Identifiants incorrects' });

  res.json({ token: signToken(admin._id), admin: { id: admin._id, name: admin.name, email: admin.email } });
});

// POST /api/auth/register (première fois seulement)
router.post('/register', async (req, res) => {
  const count = await Admin.countDocuments();
  if (count > 0)
    return res.status(403).json({ message: 'Un admin existe déjà' });

  const { email, password, name } = req.body;
  const admin = await Admin.create({ email, password, name });
  res.status(201).json({ token: signToken(admin._id), admin: { id: admin._id, name, email } });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.admin);
});

module.exports = router;
