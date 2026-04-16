const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    evaluatorName: { type: String, required: true, trim: true },
    institutionName: { type: String, required: true, trim: true },
    programName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    standard1: { type: [Number], required: true },
    standard2: { type: [Number], required: true },
    standard3: { type: [Number], required: true },
    standard4: { type: [Number], required: true },
    standard5: { type: [Number], required: true },
    standard6: { type: [Number], required: true },
    standard7: { type: [Number], required: true },
    observations: { type: String, required: true, trim: true },
    standardScores: {
      standard1: {
        total: Number,
        normalized: Number,
        weightedScore: Number,
      },
      standard2: {
        total: Number,
        normalized: Number,
        weightedScore: Number,
      },
      standard3: {
        total: Number,
        normalized: Number,
        weightedScore: Number,
      },
      standard4: {
        total: Number,
        normalized: Number,
        weightedScore: Number,
      },
      standard5: {
        total: Number,
        normalized: Number,
        weightedScore: Number,
      },
      standard6: {
        total: Number,
        normalized: Number,
        weightedScore: Number,
      },
      standard7: {
        total: Number,
        normalized: Number,
        weightedScore: Number,
      },
    },
    overallScore: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

responseSchema.index(
  { evaluatorName: 1, institutionName: 1, programName: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('AssessmentResponse', responseSchema);
