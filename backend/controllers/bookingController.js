const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Coach = require('../models/Coach');
const Equipment = require('../models/Equipment');
const PriceCalculator = require('../utils/priceCalculator');
const AvailabilityChecker = require('../utils/availabilityChecker');

exports.createBooking = async (req, res) => {
    try {
        const { courtId, startTime, endTime, equipment, coachId, notes } = req.body;
        const userId = req.user._id;

        if (!courtId || !startTime || !endTime) {
            return res.status(400).json({ error: 'Court, start time, and end time are required' });
        }

        const bookingStart = new Date(startTime);
        const bookingEnd = new Date(endTime);

        if (bookingStart < new Date()) {
            return res.status(400).json({ error: 'Cannot book in the past' });
        }

        const court = await Court.findById(courtId);
        if (!court || court.status !== 'active') {
            return res.status(400).json({ error: 'Court is not available' });
        }

        const isCourtAvailable = await AvailabilityChecker.checkCourtAvailability(courtId, bookingStart, bookingEnd);
        if (!isCourtAvailable) {
            return res.status(400).json({ error: 'Court is not available for the selected time slot' });
        }

        let coach = null;
        if (coachId) {
            coach = await Coach.findById(coachId);
            if (!coach || coach.status !== 'available') {
                return res.status(400).json({ error: 'Coach is not available' });
            }

            const isCoachAvailable = await AvailabilityChecker.checkCoachAvailability(coachId, bookingStart, bookingEnd);
            if (!isCoachAvailable) {
                return res.status(400).json({ error: 'Coach is not available for the selected time slot' });
            }
        }

        let equipmentItems = [];
        if (equipment && equipment.length > 0) {
            const equipmentAvailability = await AvailabilityChecker.checkEquipmentAvailability(equipment);
            if (!equipmentAvailability.isAvailable) {
                return res.status(400).json({
                    error: 'Some equipment is not available',
                    unavailableItems: equipmentAvailability.unavailableItems
                });
            }

            for (const item of equipment) {
                const equipmentDoc = await Equipment.findById(item.equipment);
                if (equipmentDoc) {
                    equipmentItems.push({
                        equipment: equipmentDoc,
                        quantity: item.quantity
                    });
                }
            }
        }

        const pricing = await PriceCalculator.calculatePrice(
            court,
            bookingStart,
            bookingEnd,
            equipmentItems,
            coach
        );

        const booking = new Booking({
            user: userId,
            court: courtId,
            startTime: bookingStart,
            endTime: bookingEnd,
            duration: pricing.duration,
            equipment: equipment,
            coach: coachId,
            status: 'confirmed',
            paymentStatus: 'pending',
            pricingBreakdown: {
                basePrice: pricing.basePrice,
                peakHourFee: pricing.peakHourFee,
                weekendFee: pricing.weekendFee,
                equipmentFee: pricing.equipmentFee,
                coachFee: pricing.coachFee,
                tax: pricing.tax,
                discount: pricing.discount || 0,
                total: pricing.total
            },
            notes
        });

        if (equipment && equipment.length > 0) {
            for (const item of equipment) {
                await Equipment.findByIdAndUpdate(item.equipment, {
                    $inc: { availableStock: -item.quantity }
                });
            }
        }

        await booking.save();

        res.status(201).json({
            message: 'Booking created successfully',
            booking: {
                id: booking._id,
                court: court.name,
                startTime: booking.startTime,
                endTime: booking.endTime,
                duration: booking.duration,
                totalPrice: booking.pricingBreakdown.total,
                status: booking.status
            }
        });

    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({ error: 'Failed to create booking', details: error.message });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('court', 'name type')
            .populate('coach', 'name')
            .populate('equipment.item', 'name rentalPrice')
            .sort({ startTime: -1 });

        res.json({ bookings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to cancel this booking' });
        }

        
        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        
        if (booking.status === 'completed' || booking.status === 'in-progress') {
            return res.status(400).json({ error: 'Cannot cancel a booking that has already started or completed' });
        }

        const now = new Date();

        
        const bookingStartTime = new Date(booking.startTime);

        
        if (bookingStartTime < now) {
            return res.status(400).json({ error: 'Cannot cancel a booking that has already started' });
        }

        
        const timeDifference = bookingStartTime.getTime() - now.getTime();
        const hoursBeforeBooking = timeDifference / (1000 * 60 * 60);

        
        if (hoursBeforeBooking < 2) {
            return res.status(400).json({
                error: 'Cannot cancel booking less than 2 hours before start time',
                details: {
                    bookingStartTime: bookingStartTime.toISOString(),
                    currentTime: now.toISOString(),
                    hoursRemaining: hoursBeforeBooking.toFixed(2)
                }
            });
        }

        
        if (booking.equipment && booking.equipment.length > 0) {
            for (const item of booking.equipment) {
                await Equipment.findByIdAndUpdate(item.item, {
                    $inc: { availableStock: item.quantity }
                }, { new: true });
            }
        }

        
        booking.status = 'cancelled';
        booking.cancelledAt = now;
        booking.cancelledBy = req.user._id;

        await booking.save();

        
        

        res.json({
            message: 'Booking cancelled successfully',
            booking: {
                id: booking._id,
                status: booking.status,
                cancelledAt: booking.cancelledAt
            }
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking. Please try again.' });
    }
};

exports.checkAvailability = async (req, res) => {
    try {
        const { courtId, date, duration = 1 } = req.query;

        if (!courtId || !date) {
            return res.status(400).json({ error: 'Court ID and date are required' });
        }

        const timeSlots = await AvailabilityChecker.generateTimeSlots(courtId, new Date(date), parseFloat(duration));

        res.json({ timeSlots });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.checkCoachAvailability = async (req, res) => {
    try {
        const { coachId, startTime, endTime } = req.query;

        if (!coachId || !startTime || !endTime) {
            return res.status(400).json({ error: 'Coach ID, start time, and end time are required' });
        }

        const bookingStart = new Date(startTime);
        const bookingEnd = new Date(endTime);

        
        const coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        if (coach.status !== 'available') {
            return res.json({
                isAvailable: false,
                reason: 'Coach is currently unavailable',
                coach: coach
            });
        }

        
        const dayOfWeek = bookingStart.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const coachAvailability = coach.availability.find(avail => avail.day === dayOfWeek);

        if (!coachAvailability) {
            return res.json({
                isAvailable: false,
                reason: 'Coach is not available on this day',
                coach: coach
            });
        }

        
        const bookingStartHour = bookingStart.getHours();
        const bookingEndHour = bookingEnd.getHours();
        const [availableStartHour] = coachAvailability.startTime.split(':').map(Number);
        const [availableEndHour] = coachAvailability.endTime.split(':').map(Number);

        if (bookingStartHour < availableStartHour || bookingEndHour > availableEndHour) {
            return res.json({
                isAvailable: false,
                reason: `Coach is only available from ${coachAvailability.startTime} to ${coachAvailability.endTime} on ${dayOfWeek}`,
                coach: coach
            });
        }

        
        const isCoachAvailable = await AvailabilityChecker.checkCoachAvailability(
            coachId,
            bookingStart,
            bookingEnd
        );

        return res.json({
            isAvailable: isCoachAvailable,
            coach: coach
        });

    } catch (error) {
        console.error('Coach availability check error:', error);
        res.status(500).json({ error: 'Failed to check coach availability' });
    }
};

exports.getAvailableCoaches = async (req, res) => {
    try {
        const { courtId, startTime, endTime } = req.query;

        if (!courtId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'Court ID, start time, and end time are required'
            });
        }

        const bookingStart = new Date(startTime);
        const bookingEnd = new Date(endTime);
        const dayOfWeek = bookingStart.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

        const court = await Court.findById(courtId);
        
        if (!court) {
            return res.status(404).json({
                success: false,
                error: 'Court not found'
            });
        }

        
        const query = {
            status: 'available', 
            'sportSpecialization': court.sportType 
        };

        const allCoaches = await Coach.find(query);
            
        const availableCoaches = [];

        for (const coach of allCoaches) {
            if (coach.status !== 'available') {
                continue;
            }

            
            const coachAvailability = coach.availability.find(avail =>
                avail.day.toLowerCase() === dayOfWeek &&
                avail.isActive === true
            );

            if (!coachAvailability) {
                continue;
            }
            
            const bookingStartMinutes = bookingStart.getHours() * 60 + bookingStart.getMinutes();
            const bookingEndMinutes = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

            const [availableStartHour, availableStartMin] = coachAvailability.startTime.split(':').map(Number);
            const [availableEndHour, availableEndMin] = coachAvailability.endTime.split(':').map(Number);

            const availableStartMinutes = availableStartHour * 60 + availableStartMin;
            const availableEndMinutes = availableEndHour * 60 + availableEndMin;

            if (bookingStartMinutes >= availableStartMinutes &&
                bookingEndMinutes <= availableEndMinutes) {

                try {
                    
                    const existingBookings = await Booking.find({
                        coach: coach._id,
                        status: { $in: ['confirmed', 'pending'] },
                        $or: [
                            {
                                startTime: { $lt: bookingEnd },
                                endTime: { $gt: bookingStart }
                            }
                        ]
                    });

                    if (existingBookings.length === 0) {
                        availableCoaches.push({
                            _id: coach._id,
                            name: coach.name,
                            email: coach.email,
                            phone: coach.phone,
                            sportSpecialization: coach.sportSpecialization,
                            hourlyRate: coach.hourlyRate,
                            experience: coach.experience,
                            rating: coach.rating,
                            description: coach.description,
                            imageUrl: coach.imageUrl,
                            totalSessions: coach.totalSessions
                        });
                    }
                } catch (bookingError) {
                    console.error('Error checking coach bookings:', bookingError);
                }
            }
        }

        res.json({
            success: true,
            availableCoaches,
            count: availableCoaches.length,
            message: availableCoaches.length === 0
                ? 'No coaches available for this time slot. You can still book the court without a coach.'
                : `${availableCoaches.length} coach(es) available`
        });

    } catch (error) {
        console.error('Get available coaches error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Failed to get available coaches',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getAvailableEquipment = async (req, res) => {
    try {
        const { courtId, startTime, endTime, equipmentType } = req.query;

        
        if (!courtId || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Court ID, start time, and end time are required'
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        
        const durationHours = (end - start) / (1000 * 60 * 60);

        
        let equipmentQuery = {
            status: 'available',
            totalStock: { $gt: 0 }
        };

        
        if (equipmentType) {
            equipmentQuery.type = equipmentType;
        }

        
        const allEquipment = await Equipment.find(equipmentQuery);

        
        const overlappingBookings = await Booking.aggregate([
            {
                $match: {
                    courtId: courtId,
                    status: { $in: ['confirmed', 'active'] },
                    $or: [
                        {
                            $and: [
                                { startTime: { $lt: end } },
                                { endTime: { $gt: start } }
                            ]
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: '$equipment',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    'equipment.quantity': { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: '$equipment.equipment',
                    totalBooked: { $sum: '$equipment.quantity' }
                }
            }
        ]);

        
        const bookedEquipmentMap = {};
        overlappingBookings.forEach(item => {
            if (item._id) {
                bookedEquipmentMap[item._id.toString()] = item.totalBooked;
            }
        });

        
        const availableEquipment = allEquipment.map(equipment => {
            const bookedQuantity = bookedEquipmentMap[equipment._id.toString()] || 0;
            const availableCount = Math.max(0, equipment.availableStock - bookedQuantity);
            const totalCostForSlot = equipment.rentalPrice * durationHours;

            return {
                _id: equipment._id,
                name: equipment.name,
                type: equipment.type,
                description: equipment.description,
                hourlyRate: equipment.rentalPrice,
                totalCostForSlot: parseFloat(totalCostForSlot.toFixed(2)),
                totalStock: equipment.totalStock,
                availableStock: equipment.availableStock,
                availableCount: availableCount,
                bookedCount: bookedQuantity,
                status: equipment.status,
                metadata: {
                    durationHours: parseFloat(durationHours.toFixed(2)),
                    costPerItem: equipment.rentalPrice,
                    totalCost: parseFloat(totalCostForSlot.toFixed(2))
                }
            };
        });

        
        const available = availableEquipment.filter(e => e.availableCount > 0);
        const unavailable = availableEquipment.filter(e => e.availableCount === 0);

        return res.status(200).json({
            availableEquipment: available,
            unavailableEquipment: unavailable,
            summary: {
                totalAvailable: available.length,
                totalUnavailable: unavailable.length,
                totalItems: availableEquipment.length,
                timeSlot: {
                    startTime: start,
                    endTime: end,
                    durationHours: parseFloat(durationHours.toFixed(2))
                }
            }

        });

    } catch (error) {
        console.error('Error fetching available equipment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching available equipment',
            error: error.message
        });
    }
};


exports.checkEquipmentAvailability = async (equipmentRequests, startTime, endTime, courtId) => {
    try {
        const start = new Date(startTime);
        const end = new Date(endTime);

        
        const equipmentIds = equipmentRequests.map(item => item.equipment);

        
        const equipmentItems = await Equipment.find({
            _id: { $in: equipmentIds },
            status: 'available'
        });

        
        for (const request of equipmentRequests) {
            const equipment = equipmentItems.find(e => e._id.toString() === request.equipment.toString());

            if (!equipment) {
                return {
                    available: false,
                    message: `Equipment with ID ${request.equipment} not found or not available`,
                    equipmentId: request.equipment
                };
            }

            if (equipment.availableStock < request.quantity) {
                return {
                    available: false,
                    message: `Only ${equipment.availableStock} ${equipment.name}(s) available, but ${request.quantity} requested`,
                    equipmentId: request.equipment,
                    availableStock: equipment.availableStock,
                    requestedQuantity: request.quantity
                };
            }
        }

        
        const overlappingBookings = await Booking.find({
            courtId: courtId,
            status: { $in: ['confirmed', 'active'] },
            $or: [
                { startTime: { $lt: end }, endTime: { $gt: start } }
            ]
        });

        
        const bookedEquipmentMap = {};
        overlappingBookings.forEach(booking => {
            if (booking.equipment && booking.equipment.length > 0) {
                booking.equipment.forEach(item => {
                    if (bookedEquipmentMap[item.equipment]) {
                        bookedEquipmentMap[item.equipment] += item.quantity;
                    } else {
                        bookedEquipmentMap[item.equipment] = item.quantity;
                    }
                });
            }
        });

        
        for (const request of equipmentRequests) {
            const equipment = equipmentItems.find(e => e._id.toString() === request.equipment.toString());
            const bookedQuantity = bookedEquipmentMap[request.equipment] || 0;
            const actuallyAvailable = Math.max(0, equipment.availableStock - bookedQuantity);

            if (actuallyAvailable < request.quantity) {
                return {
                    available: false,
                    message: `Only ${actuallyAvailable} ${equipment.name}(s) available for this time slot`,
                    equipmentId: request.equipment,
                    availableForSlot: actuallyAvailable,
                    requestedQuantity: request.quantity
                };
            }
        }

        return {
            available: true,
            message: 'All equipment is available'
        };

    } catch (error) {
        console.error('Error checking equipment availability:', error);
        return {
            available: false,
            message: 'Error checking equipment availability',
            error: error.message
        };
    }
};
