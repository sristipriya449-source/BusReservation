const express = require('express');
const {
  getBookedSeats,
  createBooking,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  downloadTicket,
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/route/:routeId/booked-seats', getBookedSeats);
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/', protect, adminOnly, getAllBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/:id/ticket', protect, downloadTicket);

module.exports = router;
