const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema(
  {
    roomId:   { type: String, required: true },
    username: { type: String, required: true },
    language: { type: String, required: true },
    code:     { type: String, required: true },
    output:   { type: String, default: '' },
    error:    { type: String, default: '' },
    hasError: { type: Boolean, default: false },
    executedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Log', LogSchema);
