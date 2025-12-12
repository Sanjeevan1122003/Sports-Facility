const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Court = require('../models/Court');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');
const PricingRule = require('../models/PricingRule');

dotenv.config({ quiet: true });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await User.deleteMany({});
        await Court.deleteMany({});
        await Equipment.deleteMany({});
        await Coach.deleteMany({});
        await PricingRule.deleteMany({});

        const admin = new User({
            name: 'Admin User',
            email: 'admin@sportsfacility.com',
            password: 'admin123',
            phone: '1234567890',
            role: 'admin'
        });
        await admin.save();
        console.log('Admin user created');

        const user = new User({
            name: 'Sanjeevan',
            email: 'sanjeevan@example.com',
            password: 'password123',
            phone: '0987654321',
            role: 'user'
        });
        await user.save();
        console.log('Regular user created');

        const courts = [
            {
                name: 'Court 1 - Indoor Badminton',
                type: 'indoor',
                sportType: 'badminton',
                basePrice: 2000,
                description: 'Premium indoor badminton court with wooden flooring',
                amenities: ['AC', 'Changing Room', 'Showers']
            },
            {
                name: 'Court 2 - Outdoor Badminton',
                type: 'outdoor',
                sportType: 'badminton',
                basePrice: 1500,
                description: 'Outdoor badminton court with synthetic surface',
                amenities: ['Flood Lights', 'Seating Area']
            },
            {
                name: 'Court 3 - Tennis',
                type: 'outdoor',
                sportType: 'tennis',
                basePrice: 3000,
                description: 'Professional tennis court',
                amenities: ['Net', 'Ball Machine', 'Seating']
            }
        ];

        for (const courtData of courts) {
            const court = new Court(courtData);
            await court.save();
        }
        console.log('Courts created');

        const equipment = [
            {
                name: 'Professional Badminton Racket',
                type: 'racket',
                totalStock: 20,
                availableStock: 20,
                rentalPrice: 50,
                description: 'Professional grade badminton racket'
            },
            {
                name: 'Badminton Shoes',
                type: 'shoes',
                totalStock: 15,
                availableStock: 15,
                rentalPrice: 30,
                description: 'Non-marking sports shoes'
            },
            {
                name: 'Tennis Racket',
                type: 'racket',
                totalStock: 10,
                availableStock: 10,
                rentalPrice: 80,
                description: 'Professional tennis racket'
            }
        ];

        for (const equipmentData of equipment) {
            const equipmentItem = new Equipment(equipmentData);
            await equipmentItem.save();
        }
        console.log('Equipment created');

        const coaches = [
            {
                name: 'Michael Chen',
                email: 'michael@coach.com',
                phone: '555-0101',
                sportSpecialization: ['badminton'],
                hourlyRate: 250,
                availability: [
                    { day: 'monday', startTime: '09:00', endTime: '17:00' },
                    { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
                    { day: 'friday', startTime: '09:00', endTime: '17:00' }
                ],
                experience: 5
            },
            {
                name: 'Sarah Johnson',
                email: 'sarah@coach.com',
                phone: '555-0102',
                sportSpecialization: ['tennis', 'badminton'],
                hourlyRate: 300,
                availability: [
                    { day: 'tuesday', startTime: '10:00', endTime: '18:00' },
                    { day: 'thursday', startTime: '10:00', endTime: '18:00' },
                    { day: 'saturday', startTime: '09:00', endTime: '15:00' }
                ],
                experience: 8
            }
        ];

        for (const coachData of coaches) {
            const coach = new Coach(coachData);
            await coach.save();
        }
        console.log('Coaches created');

        const pricingRules = [
            {
                name: 'Weekend Surcharge',
                type: 'weekend',
                description: 'Additional charge for weekend bookings',
                dayOfWeek: [0, 6],
                multiplier: 1.3,
                priority: 2
            },
            {
                name: 'Peak Hours (Evening)',
                type: 'peak_hour',
                description: 'Higher rates during evening peak hours',
                startTime: '18:00',
                endTime: '21:00',
                multiplier: 1.5,
                priority: 3
            },
            {
                name: 'Off-Peak Discount',
                type: 'peak_hour',
                description: 'Discount for morning bookings',
                startTime: '08:00',
                endTime: '12:00',
                multiplier: 0.8,
                priority: 1
            }
        ];

        for (const ruleData of pricingRules) {
            const rule = new PricingRule(ruleData);
            await rule.save();
        }
        console.log('Pricing rules created');

        console.log('Database seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
