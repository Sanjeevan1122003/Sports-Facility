const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');

class AvailabilityChecker {
    static async checkCourtAvailability(courtId, startTime, endTime, excludeBookingId = null) {
        const query = {
            court: courtId,
            status: { $in: ['confirmed', 'pending'] },
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
                { $and: [
                    { startTime: { $lte: startTime } },
                    { endTime: { $gte: endTime } }
                ]}
            ]
        };
        
        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }
        
        const existingBooking = await Booking.findOne(query);
        return !existingBooking;
    }
    
    static async checkCoachAvailability(coachId, startTime, endTime, excludeBookingId = null) {
        if (!coachId) return true;
        
        const query = {
            coach: coachId,
            status: { $in: ['confirmed', 'pending'] },
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } }
            ]
        };
        
        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }
        
        const existingBooking = await Booking.findOne(query);
        return !existingBooking;
    }
    
    static async checkEquipmentAvailability(equipmentItems = []) {
        const availability = {
            isAvailable: true,
            unavailableItems: []
        };
        
        for (const item of equipmentItems) {
            const equipment = await Equipment.findById(item.equipment);
            
            if (!equipment || equipment.availableStock < item.quantity) {
                availability.isAvailable = false;
                availability.unavailableItems.push({
                    equipmentId: item.equipment,
                    requested: item.quantity,
                    available: equipment ? equipment.availableStock : 0
                });
            }
        }
        
        return availability;
    }
    
    static async generateTimeSlots(courtId, date, duration = 1) {
        const slots = [];
        const startOfDay = new Date(date);
        startOfDay.setHours(8, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(22, 0, 0, 0);
        
        for (let time = startOfDay.getTime(); time < endOfDay.getTime(); time += duration * 60 * 60 * 1000) {
            const slotStart = new Date(time);
            const slotEnd = new Date(time + duration * 60 * 60 * 1000);
            
            const isAvailable = await this.checkCourtAvailability(courtId, slotStart, slotEnd);
            
            slots.push({
                startTime: slotStart,
                endTime: slotEnd,
                isAvailable,
                formattedTime: this.formatTimeSlot(slotStart, slotEnd)
            });
        }
        
        return slots;
    }
    
    static formatTimeSlot(start, end) {
        const options = { hour: '2-digit', minute: '2-digit' };
        return `${start.toLocaleTimeString([], options)} - ${end.toLocaleTimeString([], options)}`;
    }
}

module.exports = AvailabilityChecker;