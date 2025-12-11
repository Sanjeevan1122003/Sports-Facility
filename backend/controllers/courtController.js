const Court = require('../models/Court');

exports.getAllCourts = async (req, res) => {
    try {
        const courts = await Court.find({ status: 'active' });
        res.json({ courts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCourtById = async (req, res) => {
    try {
        const court = await Court.findById(req.params.id);

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        res.json({ court });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCourt = async (req, res) => {
    try {
        const court = new Court(req.body);
        await court.save();
        res.status(201).json({ message: 'Court created successfully', court });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateCourt = async (req, res) => {
    try {
        const court = await Court.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        res.json({ message: 'Court updated successfully', court });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCourt = async (req, res) => {
    try {
        const court = await Court.findByIdAndUpdate(
            req.params.id,
            { status: 'inactive', updatedAt: Date.now() },
            { new: true }
        );

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        res.json({ message: 'Court deactivated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};