const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  ageRange: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  profession: { type: String, required: true },
  insuranceCompany: { type: String, required: true },
  satisfactionScore: { type: Number, min: 1, max: 10, required: true },
  hasLifeInsurance: { type: Boolean, required: true },
  lifeInsuranceType: { type: String, enum: ['maladie', 'groupe', 'both', 'none'], default: 'none' },
  annualPremium: { type: Number, required: true },
  switchReasons: [{ type: String }],
  interested: { type: Boolean, required: true },
  phone: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Response', ResponseSchema);
