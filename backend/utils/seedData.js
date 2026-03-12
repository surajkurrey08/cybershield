require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cybershield');
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    console.log('Admin already exists — skipping');
  } else {
    await User.create({
      username: 'admin',
      email:    'admin@cybershield.io',
      password: 'Admin@1234',
      role:     'admin'
    });
    console.log('✅ Admin user created');
    console.log('   Username: admin');
    console.log('   Password: Admin@1234');
  }

  await User.findOne({ username: 'analyst' }) ||
    await User.create({ username:'analyst', email:'analyst@cybershield.io', password:'Analyst@123', role:'analyst' });
  console.log('✅ Analyst user created: analyst / Analyst@123');

  await User.findOne({ username: 'viewer' }) ||
    await User.create({ username:'viewer', email:'viewer@cybershield.io', password:'Viewer@123', role:'viewer' });
  console.log('✅ Viewer user created: viewer / Viewer@123');

  await mongoose.disconnect();
  console.log('\n🚀 Seed complete! Run: npm run dev');
}

seed().catch(console.error);
