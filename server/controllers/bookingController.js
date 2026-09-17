const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Route = require('../models/Route');
const generateTicketPDF = require('../utils/generateTicketPDF');
const { calculateTotalFare } = require('../utils/seatPricing');

// Helper to check if two seats form an adjacent pair (same row, side-by-side)
const areSeatsPaired = (seatA, seatB) => {
  const s1 = Math.min(Number(seatA), Number(seatB));
  const s2 = Math.max(Number(seatA), Number(seatB));
  const row1 = Math.floor((s1 - 1) / 4);
  const row2 = Math.floor((s2 - 1) / 4);
  if (row1 !== row2) return false;
  const pos1 = (s1 - 1) % 4;
  const pos2 = (s2 - 1) % 4;
  return (pos1 === 0 && pos2 === 1) || (pos1 === 2 && pos2 === 3);
};

const getBookedSeats = async (req, res) => {
  try {
    const bookings = await Booking.find({ route: req.params.routeId, status: 'confirmed' });
    const bookedSeats = bookings.flatMap((b) => b.seats);
    res.json({ bookedSeats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createBooking = async (req, res) => {
  const {
    routeId,
    seats,
    passengerName,
    passengerPhone,
    totalFare,
    isCouple = false,
    passengers = [],
  } = req.body;

  if (!routeId || !seats || !Array.isArray(seats) || seats.length === 0 || !passengerPhone) {
    return res.status(400).json({ message: 'Please provide all booking details and select at least one seat' });
  }

  // Determine effective passengerName
  let effectivePassengerName = passengerName ? passengerName.trim() : '';
  if (!effectivePassengerName && Array.isArray(passengers) && passengers.length > 0) {
    effectivePassengerName = passengers.map((p) => p.name).filter(Boolean).join(', ');
  }

  if (!effectivePassengerName) {
    return res.status(400).json({ message: 'Please provide passenger name(s)' });
  }

  // ── Couple Seat & Gender Business Rules Validation ──
  const isPaired = seats.length === 2 && areSeatsPaired(seats[0], seats[1]);

  if (isCouple) {
    if (seats.length !== 2 || !isPaired) {
      return res.status(400).json({
        message: 'Couple booking requires selecting exactly 2 adjacent paired seats in the same row.',
      });
    }
    if (!Array.isArray(passengers) || passengers.length < 2 || !passengers[0]?.gender || !passengers[1]?.gender) {
      return res.status(400).json({
        message: 'Please provide name and gender for both travellers for couple booking.',
      });
    }
  }

  // If 2 travellers are booking paired seats, check genders
  if (seats.length === 2 && isPaired && Array.isArray(passengers) && passengers.length >= 2) {
    const g1 = (passengers[0].gender || '').toLowerCase().trim();
    const g2 = (passengers[1].gender || '').toLowerCase().trim();

    if (g1 && g2) {
      const isOppositeGender = g1 !== g2;
      if (isOppositeGender && !isCouple) {
        return res.status(400).json({
          message:
            "These seats are reserved for couples or same-gender pairs. Please select 'Booking for a couple' or choose different seats.",
        });
      }
    }
  }

  try {
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const calculatedFare = Number(totalFare) > 0 ? Number(totalFare) : calculateTotalFare(route.fare, seats);
    const bookingData = {
      user: req.user._id,
      route: routeId,
      seats,
      passengerName: effectivePassengerName,
      passengerPhone: passengerPhone.trim(),
      totalFare: calculatedFare,
      isCouple: Boolean(isCouple),
      passengers: Array.isArray(passengers) ? passengers : [],
      status: 'confirmed',
    };

    let booking;
    let session = null;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const existing = await Booking.find({
          route: routeId,
          status: 'confirmed',
          seats: { $in: seats },
        }).session(session);

        if (existing.length > 0) {
          const err = new Error('One or more selected seats are already booked');
          err.statusCode = 409;
          throw err;
        }

        const created = await Booking.create([bookingData], { session });
        booking = created[0];
      });
    } catch (txErr) {
      if (txErr.statusCode === 409) {
        return res.status(409).json({ message: txErr.message });
      }
      // If transactions are not supported by the MongoDB deployment (e.g. standalone instance)
      if (
        txErr.message &&
        (txErr.message.includes('Transaction numbers') ||
          txErr.message.includes('replica set') ||
          txErr.message.includes('standalone') ||
          txErr.message.includes('not supported'))
      ) {
        const existing = await Booking.find({
          route: routeId,
          status: 'confirmed',
          seats: { $in: seats },
        });

        if (existing.length > 0) {
          return res.status(409).json({ message: 'One or more selected seats are already booked' });
        }

        booking = await Booking.create(bookingData);
      } else {
        throw txErr;
      }
    } finally {
      if (session) {
        session.endSession();
      }
    }

    res.status(201).json(booking);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({ path: 'route', populate: { path: 'bus' } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate({ path: 'route', populate: { path: 'bus' } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadTicket = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'route',
      populate: { path: 'bus' },
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    generateTicketPDF(booking, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBookedSeats,
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  downloadTicket,
};
