const mongoose = require('mongoose');

const blockedIPSchema = new mongoose.Schema({
  ip:          { type: String, required: true, unique: true },
  reason:      { type: String, required: true },
  severity:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  blockedBy:   { type: String, default: 'system' },
  attackCount: { type: Number, default: 1 },
  autoBlocked: { type: Boolean, default: false },
  expiresAt:   { type: Date },
  country:     { type: String, default: 'Unknown' },
  notes:       { type: String, default: '' },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true, collection: 'blocked_ips' });

blockedIPSchema.index({ ip: 1 });
blockedIPSchema.index({ isActive: 1 });

module.exports = mongoose.model('BlockedIP', blockedIPSchema);
