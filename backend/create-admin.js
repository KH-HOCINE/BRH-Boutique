require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const admin = new Admin({
      email: 'bhr@gmail.com',
      password: '123456',
      name: 'Admin'
    });

    await admin.save();

    console.log('Admin créé avec succès');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createAdmin();