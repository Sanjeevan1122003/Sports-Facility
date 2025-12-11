const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

router.post('/bookings', auth, bookingController.createBooking);
router.get('/bookings/availability', bookingController.checkAvailability);
router.get('/bookings/my-bookings', auth, bookingController.getUserBookings);
router.put('/bookings/:bookingId/cancel', auth, bookingController.cancelBooking);
router.get('/bookings/coach-availability', bookingController.checkCoachAvailability);
router.get('/coaches/available', bookingController.getAvailableCoaches);
router.get('/bookings/available-equipment', bookingController.getAvailableEquipment)

module.exports = router;