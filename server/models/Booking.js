const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    seats: { type: [Number], required: true },
    passengerName: { type: String, required: true },
    passengerPhone: { type: String, required: true },
    totalFare: { type: Number, required: true },
    isCouple: { type: Boolean, default: false },
    passengers: { type: [passengerSchema], default: [] },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
