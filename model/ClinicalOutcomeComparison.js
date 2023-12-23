const mongoose = require('mongoose');

const outcomeSchema = new mongoose.Schema({
  ward: String,
  readmissionRate: String,
  avgLengthRate: String,
  mortalityRate: String,
  date: String,
});

const clinicalOutcomeComparisonSchema = new mongoose.Schema({
  ward: String,
  timeInterval: String,
  mortalityRate: String,
  infectionRate: String,
  outcomes: [outcomeSchema], // Use 'outcomes' field to embed the outcomeSchema
});

const ClinicalOutcomeComparison = mongoose.model('ClinicalOutcomeComparison', clinicalOutcomeComparisonSchema);

module.exports = ClinicalOutcomeComparison;
