const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/courts', courtController.getAllCourts);
router.get('/courts/:id', courtController.getCourtById);
router.post('/courts', auth, isAdmin, courtController.createCourt);
router.put('/courts/:id', auth, isAdmin, courtController.updateCourt);
router.delete('/courts/:id', auth, isAdmin, courtController.deleteCourt);

module.exports = router;