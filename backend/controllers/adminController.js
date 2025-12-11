const mongoose = require('mongoose');
const PricingRule = require('../models/PricingRule');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalBookings,
            confirmedBookings,
            revenueResult,
            todaysBookings,
            activeUsers,
            availableCourts,
            activeCoaches,
            totalEquipment
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'confirmed' }),

            Booking.aggregate([
                { $match: { status: { $in: ['confirmed', 'completed'] } } },
                { $group: { _id: null, total: { $sum: '$pricingBreakdown.total' } } }
            ]),

            Booking.countDocuments({
                startTime: { $gte: today, $lt: tomorrow }
            }),

            User.countDocuments({ status: 'active' }),

            Court.countDocuments({ status: 'active' }),

            Coach.countDocuments({ status: 'available' }),

            Equipment.aggregate([
                { $group: { _id: null, total: { $sum: '$totalStock' } } }
            ])
        ]);

        res.json({
            stats: {
                totalBookings: totalBookings || 0,
                confirmedBookings: confirmedBookings || 0,
                totalRevenue: revenueResult[0]?.total || 0,
                todaysBookings: todaysBookings || 0,
                activeUsers: activeUsers || 0,
                availableCourts: availableCourts || 0,
                activeCoaches: activeCoaches || 0,
                totalEquipment: totalEquipment[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};


exports.getAllCourts = async (req, res) => {
    try {
        const courts = await Court.find().sort({ createdAt: -1 });
        res.json({ courts });
    } catch (error) {
        console.error('Get all courts error:', error);
        res.status(500).json({ error: 'Failed to fetch courts' });
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
        console.error('Get court by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch court details' });
    }
};

exports.createCourt = async (req, res) => {
    try {
        const { name, type, sportType, basePrice, description, amenities = [] } = req.body;

        if (!name || !type || !sportType || !basePrice) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const court = new Court({
            name,
            type,
            sportType,
            basePrice: parseFloat(basePrice),
            description: description || '',
            amenities,
            status: 'active'
        });

        await court.save();

        res.status(201).json({
            message: 'Court created successfully',
            court
        });
    } catch (error) {
        console.error('Create court error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errors.join(', ') });
        }

        res.status(500).json({ error: 'Failed to create court' });
    }
};

exports.updateCourt = async (req, res) => {
    try {
        const court = await Court.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        res.json({
            message: 'Court updated successfully',
            court
        });
    } catch (error) {
        console.error('Update court error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errors.join(', ') });
        }

        res.status(500).json({ error: 'Failed to update court' });
    }
};

exports.deleteCourt = async (req, res) => {
    try {
        const courtId = req.params.id;

        
        const upcomingBookings = await Booking.findOne({
            court: courtId,
            startTime: { $gte: new Date() },
            status: { $in: ['confirmed', 'pending'] }
        });

        if (upcomingBookings) {
            return res.status(400).json({
                error: 'Cannot delete court with upcoming bookings. Please cancel bookings first.'
            });
        }

        const court = await Court.findByIdAndDelete(courtId);

        if (!court) {
            return res.status(404).json({ error: 'Court not found' });
        }

        res.json({
            message: 'Court deleted successfully'
        });
    } catch (error) {
        console.error('Delete court error:', error);
        res.status(500).json({ error: 'Failed to delete court' });
    }
};


exports.getAllBookings = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('court', 'name')
            .populate('coach', 'name')
            .select('-__v')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.json({ bookings });
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('court', 'name type sportType')
            .populate('coach', 'name hourlyRate')
            .populate('equipment.item', 'name rentalPrice');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ booking });
    } catch (error) {
        console.error('Get booking by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch booking details' });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;  
        const { status } = req.body;

        if (!status || !['confirmed', 'cancelled', 'completed', 'no_show', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required' });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        
        if (status === 'cancelled' && booking.equipment && booking.equipment.length > 0) {
            for (const item of booking.equipment) {
                await Equipment.findByIdAndUpdate(item.item, {
                    $inc: { availableStock: item.quantity }
                });
            }
        }

        
        if (booking.status === 'cancelled' && status === 'confirmed' && booking.equipment && booking.equipment.length > 0) {
            for (const item of booking.equipment) {
                await Equipment.findByIdAndUpdate(item.item, {
                    $inc: { availableStock: -item.quantity }
                });
            }
        }

        booking.status = status;
        await booking.save();

        res.json({
            message: 'Booking status updated successfully',
            booking
        });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({ error: 'Failed to update booking status' });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        
        if (booking.equipment && booking.equipment.length > 0) {
            for (const item of booking.equipment) {
                await Equipment.findByIdAndUpdate(item.item, {
                    $inc: { availableStock: item.quantity }
                });
            }
        }

        await Booking.findByIdAndDelete(bookingId);

        res.json({
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const users = await User.find()
            .select('-password -__v')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -__v');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        
        const userBookings = await Booking.find({ user: user._id })
            .populate('court', 'name')
            .populate('coach', 'name')
            .sort({ createdAt: -1 });

        res.json({
            user,
            bookings: userBookings
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;  
        const { status } = req.body;

        if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.status = status;
        await user.save();

        res.json({
            message: 'User status updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;  
        const { role } = req.body;

        if (!role || !['user', 'admin', 'coach'].includes(role)) {
            return res.status(400).json({ error: 'Valid role is required' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            message: 'User role updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};


exports.createPricingRule = async (req, res) => {
    try {
        const {
            name,
            type,
            description,
            applyTo = 'all',
            courts = [],
            dayOfWeek = [],
            multiplier = 1.0,
            fixedSurcharge = 0,
            isActive = true,
            priority = 1
        } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        const pricingRule = new PricingRule({
            name,
            type,
            description: description || '',
            applyTo,
            courts,
            dayOfWeek,
            multiplier: parseFloat(multiplier),
            fixedSurcharge: parseFloat(fixedSurcharge),
            isActive,
            priority: parseInt(priority)
        });

        await pricingRule.save();

        res.status(201).json({
            message: 'Pricing rule created successfully',
            pricingRule
        });
    } catch (error) {
        console.error('Create pricing rule error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.getAllPricingRules = async (req, res) => {
    try {
        const pricingRules = await PricingRule.find().sort({ priority: -1 });
        res.json({ pricingRules });
    } catch (error) {
        console.error('Get all pricing rules error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getPricingRuleById = async (req, res) => {
    try {
        const pricingRule = await PricingRule.findById(req.params.id);

        if (!pricingRule) {
            return res.status(404).json({ error: 'Pricing rule not found' });
        }

        res.json({ pricingRule });
    } catch (error) {
        console.error('Get pricing rule by ID error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updatePricingRule = async (req, res) => {
    try {
        const pricingRule = await PricingRule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!pricingRule) {
            return res.status(404).json({ error: 'Pricing rule not found' });
        }

        res.json({
            message: 'Pricing rule updated successfully',
            pricingRule
        });
    } catch (error) {
        console.error('Update pricing rule error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.deletePricingRule = async (req, res) => {
    try {
        const pricingRule = await PricingRule.findByIdAndDelete(req.params.id);

        if (!pricingRule) {
            return res.status(404).json({ error: 'Pricing rule not found' });
        }

        res.json({
            message: 'Pricing rule deleted successfully'
        });
    } catch (error) {
        console.error('Delete pricing rule error:', error);
        res.status(500).json({ error: error.message });
    }
};


exports.createEquipment = async (req, res) => {
    try {
        const {
            name,
            type,
            totalStock,
            rentalPrice,
            description,
            status = 'available'
        } = req.body;

        if (!name || !type || !totalStock || !rentalPrice) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const equipment = new Equipment({
            name,
            type,
            totalStock: parseInt(totalStock),
            availableStock: parseInt(totalStock),
            rentalPrice: parseFloat(rentalPrice),
            description: description || '',
            status
        });

        await equipment.save();

        res.status(201).json({
            message: 'Equipment created successfully',
            equipment
        });
    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.getAllEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.find().sort({ createdAt: -1 });
        res.json({ equipment });
    } catch (error) {
        console.error('Get all equipment error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getEquipmentById = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }

        res.json({ equipment });
    } catch (error) {
        console.error('Get equipment by ID error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }

        res.json({
            message: 'Equipment updated successfully',
            equipment
        });
    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.deleteEquipment = async (req, res) => {
    try {
        const equipmentId = req.params.id;

        
        const bookingsWithEquipment = await Booking.findOne({
            'equipment.item': equipmentId,
            status: { $in: ['confirmed', 'pending'] }
        });

        if (bookingsWithEquipment) {
            return res.status(400).json({
                error: 'Cannot delete equipment that is booked in upcoming bookings'
            });
        }

        const equipment = await Equipment.findByIdAndDelete(equipmentId);

        if (!equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }

        res.json({
            message: 'Equipment deleted successfully'
        });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({ error: error.message });
    }
};


exports.getAllCoaches = async (req, res) => {
    try {
        const coaches = await Coach.find().sort({ createdAt: -1 });
        res.json({ coaches });
    } catch (error) {
        console.error('Get all coaches error:', error);
        res.status(500).json({ error: 'Failed to fetch coaches' });
    }
};

exports.getCoachById = async (req, res) => {
    try {
        const coach = await Coach.findById(req.params.id);

        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        
        const upcomingBookings = await Booking.find({
            coach: coach._id,
            startTime: { $gte: new Date() },
            status: { $in: ['confirmed', 'pending'] }
        })
            .populate('user', 'name email')
            .populate('court', 'name')
            .sort({ startTime: 1 });

        res.json({
            coach,
            upcomingBookings: upcomingBookings || []
        });
    } catch (error) {
        console.error('Get coach by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch coach details' });
    }
};

exports.createCoach = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            sportSpecialization,
            hourlyRate,
            experience,
            availability,
            description,
            status = 'available'
        } = req.body;

        
        if (!name || !email || !phone || !hourlyRate || !experience) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        
        const existingCoach = await Coach.findOne({ email });
        if (existingCoach) {
            return res.status(400).json({ error: 'Coach with this email already exists' });
        }

        const coach = new Coach({
            name,
            email,
            phone,
            sportSpecialization: sportSpecialization || ['badminton'],
            hourlyRate: parseFloat(hourlyRate),
            experience: parseInt(experience),
            availability: availability || [],
            description: description || '',
            status
        });

        await coach.save();

        res.status(201).json({
            message: 'Coach created successfully',
            coach
        });
    } catch (error) {
        console.error('Create coach error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errors.join(', ') });
        }

        res.status(500).json({ error: 'Failed to create coach' });
    }
};

exports.updateCoach = async (req, res) => {
    try {
        const { id } = req.params;  
        const updates = req.body;

        
        const coach = await Coach.findById(id);
        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        
        if (updates.email && updates.email !== coach.email) {
            const existingCoach = await Coach.findOne({ email: updates.email });
            if (existingCoach && existingCoach._id.toString() !== id) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        
        Object.keys(updates).forEach(key => {
            if (key !== '_id' && key !== '__v') {
                coach[key] = updates[key];
            }
        });

        await coach.save();

        res.json({
            message: 'Coach updated successfully',
            coach
        });
    } catch (error) {
        console.error('Update coach error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errors.join(', ') });
        }

        res.status(500).json({ error: 'Failed to update coach' });
    }
};

exports.deleteCoach = async (req, res) => {
    try {
        const { id } = req.params;  

        
        const upcomingBookings = await Booking.findOne({
            coach: id,
            startTime: { $gte: new Date() },
            status: { $in: ['confirmed', 'pending'] }
        });

        if (upcomingBookings) {
            return res.status(400).json({
                error: 'Cannot delete coach with upcoming bookings. Please cancel bookings first.'
            });
        }

        const coach = await Coach.findByIdAndDelete(id);

        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        res.json({
            message: 'Coach deleted successfully'
        });
    } catch (error) {
        console.error('Delete coach error:', error);
        res.status(500).json({ error: 'Failed to delete coach' });
    }
};

exports.updateCoachAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { availability } = req.body;

        console.log('Updating coach availability for ID:', id);

        if (!availability || !Array.isArray(availability)) {
            return res.status(400).json({
                success: false,
                error: 'Availability must be an array'
            });
        }

        
        for (const [index, slot] of availability.entries()) {
            if (!slot.day || !slot.startTime || !slot.endTime) {
                return res.status(400).json({
                    success: false,
                    error: `Slot ${index + 1} must have day, startTime, and endTime`
                });
            }

            
            const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            if (!validDays.includes(slot.day.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid day '${slot.day}' in slot ${index + 1}. Must be one of: ${validDays.join(', ')}`
                });
            }

            
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid time format in slot ${index + 1}. Must be HH:MM (24-hour format)`
                });
            }

            
            const start = new Date(`2000/01/01 ${slot.startTime}`);
            const end = new Date(`2000/01/01 ${slot.endTime}`);
            if (start >= end) {
                return res.status(400).json({
                    success: false,
                    error: `Start time must be before end time in slot ${index + 1}`
                });
            }
        }

        
        const coach = await Coach.findById(id);

        if (!coach) {
            return res.status(404).json({
                success: false,
                error: 'Coach not found'
            });
        }

        console.log('Found coach:', coach.name);

        
        coach.availability = availability.map(slot => ({
            day: slot.day.toLowerCase(),
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive !== undefined ? slot.isActive : true
        }));

        
        coach.markModified('availability');

        
        const updatedCoach = await Coach.findByIdAndUpdate(
            id,
            {
                $set: {
                    availability: coach.availability,
                    updatedAt: Date.now()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedCoach) {
            return res.status(404).json({
                success: false,
                error: 'Coach not found after update'
            });
        }

        console.log('Coach availability updated successfully');

        res.json({
            success: true,
            message: 'Coach availability updated successfully',
            coach: {
                id: updatedCoach._id,
                name: updatedCoach.name,
                availability: updatedCoach.availability
            }
        });

    } catch (error) {
        console.error('Update coach availability error:', error);
        console.error('Error stack:', error.stack);

        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                error: 'Invalid coach ID format'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update coach availability',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.updateCoachStatus = async (req, res) => {
    try {
        const { id } = req.params;  
        const { status } = req.body;

        if (!status || !['available', 'unavailable', 'on_leave'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required' });
        }

        const coach = await Coach.findById(id);
        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        
        if (status === 'unavailable') {
            const upcomingBookings = await Booking.find({
                coach: id,
                startTime: { $gte: new Date() },
                status: { $in: ['confirmed', 'pending'] }
            });

            if (upcomingBookings.length > 0) {
                return res.status(400).json({
                    error: 'Coach has upcoming bookings. Please cancel them before setting to unavailable.',
                    upcomingBookings: upcomingBookings.length
                });
            }
        }

        coach.status = status;
        await coach.save();

        res.json({
            message: 'Coach status updated successfully',
            status: coach.status
        });
    } catch (error) {
        console.error('Update coach status error:', error);
        res.status(500).json({ error: 'Failed to update coach status' });
    }
};

exports.updateCoachRate = async (req, res) => {
    try {
        const { id } = req.params;  
        const { hourlyRate } = req.body;

        if (!hourlyRate || isNaN(hourlyRate) || hourlyRate < 0) {
            return res.status(400).json({ error: 'Valid hourly rate is required' });
        }

        const coach = await Coach.findById(id);
        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        coach.hourlyRate = parseFloat(hourlyRate);
        await coach.save();

        res.json({
            message: 'Coach hourly rate updated successfully',
            hourlyRate: coach.hourlyRate
        });
    } catch (error) {
        console.error('Update coach rate error:', error);
        res.status(500).json({ error: 'Failed to update coach rate' });
    }
};

exports.getCoachStats = async (req, res) => {
    try {
        const { id } = req.params;  

        const coach = await Coach.findById(id);
        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const [
            totalBookings,
            monthlyBookings,
            weeklyBookings,
            upcomingBookings,
            totalRevenue
        ] = await Promise.all([
            
            Booking.countDocuments({ coach: id, status: { $in: ['confirmed', 'completed'] } }),

            
            Booking.countDocuments({
                coach: id,
                status: { $in: ['confirmed', 'completed'] },
                createdAt: { $gte: startOfMonth }
            }),

            
            Booking.countDocuments({
                coach: id,
                status: { $in: ['confirmed', 'completed'] },
                createdAt: { $gte: startOfWeek }
            }),

            
            Booking.countDocuments({
                coach: id,
                status: { $in: ['confirmed', 'pending'] },
                startTime: { $gte: new Date() }
            }),

            
            Booking.aggregate([
                { $match: { coach: mongoose.Types.ObjectId(id), status: { $in: ['confirmed', 'completed'] } } },
                { $group: { _id: null, totalRevenue: { $sum: "$pricingBreakdown.coachFee" } } }
            ])
        ]);

        res.json({
            stats: {
                totalBookings: totalBookings || 0,
                monthlyBookings: monthlyBookings || 0,
                weeklyBookings: weeklyBookings || 0,
                upcomingBookings: upcomingBookings || 0,
                totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0,
                rating: coach.rating || 0,
                experience: coach.experience || 0,
                status: coach.status
            }
        });
    } catch (error) {
        console.error('Get coach stats error:', error);
        res.status(500).json({ error: 'Failed to fetch coach statistics' });
    }
};


exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchStage = {};
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        }

        const revenueData = await Booking.aggregate([
            { $match: { ...matchStage, status: { $in: ['confirmed', 'completed'] } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalRevenue: { $sum: '$pricingBreakdown.total' },
                    bookingCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({ revenueData });
    } catch (error) {
        console.error('Get revenue analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
};

exports.getPopularSports = async (req, res) => {
    try {
        const popularSports = await Booking.aggregate([
            {
                $lookup: {
                    from: 'courts',
                    localField: 'court',
                    foreignField: '_id',
                    as: 'courtData'
                }
            },
            { $unwind: '$courtData' },
            {
                $group: {
                    _id: '$courtData.sportType',
                    bookingCount: { $sum: 1 },
                    totalRevenue: { $sum: '$pricingBreakdown.total' }
                }
            },
            { $sort: { bookingCount: -1 } }
        ]);

        res.json({ popularSports });
    } catch (error) {
        console.error('Get popular sports error:', error);
        res.status(500).json({ error: 'Failed to fetch popular sports data' });
    }
};