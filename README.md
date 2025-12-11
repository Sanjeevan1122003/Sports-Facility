# Sports Facility Court Booking Platform

A full-stack web application for managing sports facility court bookings with multi-resource scheduling and dynamic pricing.

## Features

- **User Authentication**: Register, login, and profile management
- **Court Booking**: Browse courts, select time slots, add equipment/coaches
- **Dynamic Pricing**: Real-time price calculation based on rules
- **Multi-Resource Scheduling**: Simultaneous booking of courts, equipment, and coaches
- **Admin Dashboard**: Manage courts, equipment, coaches, pricing rules
- **Booking Management**: View, cancel, and track bookings

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing

### Frontend
- React.js
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Recharts for data visualization

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- npm or yarn

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend

sports-facility-booking/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── courtController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Court.js
│   │   ├── Equipment.js
│   │   ├── Coach.js
│   │   ├── PricingRule.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── courtRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── priceCalculator.js
│   │   └── availabilityChecker.js
│   ├── scripts/
│   │   └── seed.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── CourtCard.js
    │   │   ├── TimeSlotSelector.js
    │   │   └── BookingForm.js
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── BookCourt.js
    │   │   ├── MyBookings.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   └── AdminDashboard.js
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── bookingService.js
    │   │   └── adminService.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── .env
    ├── package.json
    └── tailwind.config.js