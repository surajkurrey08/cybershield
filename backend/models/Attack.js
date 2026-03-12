const mongoose = require('mongoose');

const attackSchema = new mongoose.Schema({
  sourceIP:   { type: String, required: true },
  destIP:     { type: String, required: true },
  port:       { type: Number },
  protocol:   { type: String },
  attackType: { type: String, required: true },
  severity:   { type: String, enum: ['low','medium','high','critical'], required: true },
  payload:    { type: String },
  country:    { type: String, default: 'Unknown' },
  city:       { type: String, default: '' },
  lat:        { type: Number },
  lon:        { type: Number },
  size:       { type: Number },
  status:     { type: String, enum: ['detected','blocked','investigating','resolved'], default: 'detected' },
  blocked:    { type: Boolean, default: false },
  timestamp:  { type: Date, default: Date.now }
}, { timestamps: true, collection: 'attacks' });

attackSchema.index({ timestamp: -1 });
attackSchema.index({ severity: 1 });
attackSchema.index({ sourceIP: 1 });

module.exports = mongoose.model('Attack', attackSchema);
