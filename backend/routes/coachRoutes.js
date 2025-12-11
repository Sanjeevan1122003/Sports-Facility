const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/coaches', coachController.getAllCoaches);
router.get('/coaches/:id', coachController.getCoachById);
router.post('/coaches', auth, isAdmin, coachController.createCoach);
router.put('/coaches/:id', auth, isAdmin, coachController.updateCoach);
router.delete('/coaches/:id', auth, isAdmin, coachController.deleteCoach);
router.put('/coaches/:id/availability', auth, isAdmin, coachController.updateAvailability);

module.exports = router;