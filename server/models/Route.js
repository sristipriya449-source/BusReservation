const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: Date, required: true },
    duration: { type: String, required: true },
    fare: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
