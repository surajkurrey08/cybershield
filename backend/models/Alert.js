const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type:          { type: String, required: true },
  severity:      { type: String, enum: ['low','medium','high','critical'], required: true },
  sourceIP:      { type: String },
  destIP:        { type: String },
  port:          { type: Number },
  protocol:      { type: String },
  description:   { type: String },
  ruleTriggered: { type: String },
  country:       { type: String, default: 'Unknown' },
  status:        { type: String, enum: ['active','acknowledged','resolved','false_positive'], default: 'active' },
  acknowledgedBy:{ type: String },
  resolvedAt:    { type: Date },
  timestamp:     { type: Date, default: Date.now }
}, { timestamps: true, collection: 'alerts' });

module.exports = mongoose.model('Alert', alertSchema);
