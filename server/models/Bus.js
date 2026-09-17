const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busName: { type: String, required: true },
    busNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    totalSeats: { type: Number, required: true, default: 32 },
    rating: { type: Number, default: 4.2 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bus', busSchema);
