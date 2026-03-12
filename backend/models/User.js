const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  avatar: { type: String, default: '' },
  activityLog: [{
    action:    { type: String },
    details:   { type: String },
    ip:        { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true, collection: 'users' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.logActivity = function (action, details, ip = '') {
  this.activityLog.unshift({ action, details, ip, timestamp: new Date() });
  if (this.activityLog.length > 100) this.activityLog = this.activityLog.slice(0, 100);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
