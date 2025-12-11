const PricingRule = require('../models/PricingRule');

class PriceCalculator {
    static async calculatePrice(court, startTime, endTime, equipmentItems = [], coach = null) {
        const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);

        let basePrice = court.basePrice * duration;

        const activeRules = await PricingRule.find({ isActive: true });

        let peakHourFee = 0;
        let weekendFee = 0;
        let specialEventFee = 0;

        const bookingDate = new Date(startTime);
        const dayOfWeek = bookingDate.getDay();
        const hour = bookingDate.getHours();

        const sortedRules = activeRules.sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
            if (!this.doesRuleApply(rule, court, bookingDate)) continue;

            switch (rule.type) {
                case 'peak_hour':
                    if (this.isTimeInRange(hour, rule.startTime, rule.endTime)) {
                        peakHourFee = (basePrice * rule.multiplier) - basePrice;
                    }
                    break;

                case 'weekend':
                    if (rule.dayOfWeek.includes(dayOfWeek)) {
                        weekendFee = rule.fixedSurcharge || (basePrice * rule.multiplier) - basePrice;
                    }
                    break;

                case 'holiday':
                case 'special_event':
                    specialEventFee = rule.fixedSurcharge || (basePrice * rule.multiplier) - basePrice;
                    break;
            }
        }

        let equipmentFee = 0;
        for (const item of equipmentItems) {
            equipmentFee += item.equipment.rentalPrice * item.quantity;
        }

        let coachFee = 0;
        if (coach) {
            coachFee = coach.hourlyRate * duration;
        }

        const subtotal = basePrice + peakHourFee + weekendFee + specialEventFee + equipmentFee + coachFee;
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        return {
            basePrice,
            peakHourFee,
            weekendFee,
            specialEventFee,
            equipmentFee,
            coachFee,
            tax,
            subtotal,
            total,
            duration
        };
    }

    static doesRuleApply(rule, court, date) {
        if (rule.applyTo === 'specific_courts' && !rule.courts.includes(court._id)) {
            return false;
        }

        if (rule.startDate && rule.endDate) {
            const ruleStart = new Date(rule.startDate);
            const ruleEnd = new Date(rule.endDate);
            if (date < ruleStart || date > ruleEnd) {
                return false;
            }
        }

        return true;
    }

    static isTimeInRange(hour, startTime, endTime) {
        if (!startTime || !endTime) return false;

        const [startHour] = startTime.split(':').map(Number);
        const [endHour] = endTime.split(':').map(Number);

        return hour >= startHour && hour < endHour;
    }
}

module.exports = PriceCalculator;