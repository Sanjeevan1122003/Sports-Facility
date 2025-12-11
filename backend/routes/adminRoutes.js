const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/dashboard/stats', auth, isAdmin, adminController.getDashboardStats);
router.get('/courts', auth, isAdmin, adminController.getAllCourts);
router.get('/courts/:id', auth, isAdmin, adminController.getCourtById);
router.post('/courts', auth, isAdmin, adminController.createCourt);
router.put('/courts/:id', auth, isAdmin, adminController.updateCourt);
router.delete('/courts/:id', auth, isAdmin, adminController.deleteCourt);


router.get('/bookings', auth, isAdmin, adminController.getAllBookings);
router.get('/bookings/:id', auth, isAdmin, adminController.getBookingById);
router.put('/bookings/:bookingId/status', auth, isAdmin, adminController.updateBookingStatus);
router.delete('/bookings/:id', auth, isAdmin, adminController.deleteBooking);


router.get('/users', auth, isAdmin, adminController.getAllUsers);
router.get('/users/:id', auth, isAdmin, adminController.getUserById);
router.put('/users/:userId/status', auth, isAdmin, adminController.updateUserStatus);
router.put('/users/:userId/role', auth, isAdmin, adminController.updateUserRole);


router.get('/pricing-rules', auth, isAdmin, adminController.getAllPricingRules);
router.get('/pricing-rules/:id', auth, isAdmin, adminController.getPricingRuleById);
router.post('/pricing-rules', auth, isAdmin, adminController.createPricingRule);
router.put('/pricing-rules/:id', auth, isAdmin, adminController.updatePricingRule);
router.delete('/pricing-rules/:id', auth, isAdmin, adminController.deletePricingRule);


router.get('/equipment', auth, isAdmin, adminController.getAllEquipment);
router.get('/equipment/:id', auth, isAdmin, adminController.getEquipmentById);
router.post('/equipment', auth, isAdmin, adminController.createEquipment);
router.put('/equipment/:id', auth, isAdmin, adminController.updateEquipment);
router.delete('/equipment/:id', auth, isAdmin, adminController.deleteEquipment);


router.get('/coaches', auth, isAdmin, adminController.getAllCoaches);
router.get('/coaches/:id', auth, isAdmin, adminController.getCoachById);
router.get('/coaches/:id/stats', auth, isAdmin, adminController.getCoachStats);
router.post('/coaches', auth, isAdmin, adminController.createCoach);
router.put('/coaches/:id', auth, isAdmin, adminController.updateCoach);
router.delete('/coaches/:id', auth, isAdmin, adminController.deleteCoach);
router.put('/coaches/:id/availability', auth, isAdmin, adminController.updateCoachAvailability);
router.put('/coaches/:id/status', auth, isAdmin, adminController.updateCoachStatus);
router.put('/coaches/:id/rate', auth, isAdmin, adminController.updateCoachRate);


router.get('/analytics/revenue', auth, isAdmin, adminController.getRevenueAnalytics);
router.get('/analytics/popular-sports', auth, isAdmin, adminController.getPopularSports);

module.exports = router;
