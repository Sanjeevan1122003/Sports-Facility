const Coach = require('../models/Coach');

exports.getAllCoaches = async (req, res) => {
    try {
        const { status, sport } = req.query;

        const query = {};
        if (status) query.status = status;
        if (sport) query.sportSpecialization = sport;

        const coaches = await Coach.find(query)
            .select('name sportSpecialization hourlyRate rating experience availability status')
            .sort({ rating: -1, experience: -1 });

        res.json({
            coaches,
            count: coaches.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCoachById = async (req, res) => {
    try {
        const coach = await Coach.findById(req.params.id);

        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        res.json({ coach });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCoach = async (req, res) => {
    try {
        const coach = new Coach(req.body);
        await coach.save();
        res.status(201).json({ coach });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCoach = async (req, res) => {
    try {
        const coach = await Coach.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        res.json({ coach });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCoach = async (req, res) => {
    try {
        const coach = await Coach.findByIdAndDelete(req.params.id);

        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        res.json({ message: 'Coach deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAvailability = async (req, res) => {
    try {
        const { availability } = req.body;

        const coach = await Coach.findByIdAndUpdate(
            req.params.id,
            { availability },
            { new: true, runValidators: true }
        );

        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        res.json({ coach });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};