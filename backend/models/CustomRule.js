const mongoose = require('mongoose');

const customRuleSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, required: true },
  type:        { type: String, required: true, uppercase: true },
  severity:    { type: String, enum: ['low','medium','high','critical'], required: true },
  isActive:    { type: Boolean, default: true },
  isCustom:    { type: Boolean, default: true },
  createdBy:   { type: String, default: 'admin' },
  conditions: {
    payloadContains: { type: [String], default: [] },
    ports:           { type: [Number], default: [] },
    requestRate:     { type: Number },
    failedLogins:    { type: Number },
    portsScanned:    { type: Number }
  },
  triggerCount: { type: Number, default: 0 }
}, { timestamps: true, collection: 'custom_rules' });

module.exports = mongoose.model('CustomRule', customRuleSchema);
