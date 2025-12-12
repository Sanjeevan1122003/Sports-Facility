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
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in .env:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```
4. Seed the database:
   ```
   npm run seed
   ```
5. Start the backend server:
   ```
   npm run dev
   ```
### Frontend Setup
1. Navigate to frontend directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in .env:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   SKIP_PREFLIGHT_CHECK=true
   ```
4. Start the frontend development server:
   ```
   npm start
   ```
### Access the Application
```
Frontend: http://localhost:3000
Backend API: http://localhost:5000
```
### Test Credentials
```
Admin: admin@sportsfacility.com / admin123
User: sanjeevan@example.com / password123
```

## API Endpoints
### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /api/auth/profile - Get user profile

### Courts
- GET /api/courts - Get all courts
- GET /api/courts/:id - Get specific court
- POST /api/courts - Create court (admin only)

### Bookings
- POST /api/bookings - Create booking
- GET /api/bookings/my-bookings - Get user bookings
- PUT /api/bookings/:id/cancel - Cancel booking
- GET /api/bookings/availability - Check availability

### Admin
- GET /api/admin/dashboard/stats - Get dashboard statistics
- POST /api/admin/pricing-rules - Create pricing rules
- POST /api/admin/equipment - Add equipment
- POST /api/admin/coaches - Add coaches

## Project Structure
```
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
    └── .env
```

## Key Features Implementation

### Multi-Resource Scheduling
- Checks court availability based on overlapping time slots
- Verifies coach availability for selected time
- Ensures equipment stock is available

### Dynamic Pricing Engine
- Configurable pricing rules (peak hours, weekends, holidays)
- Real-time price calculation
- Rule priority system

### Admin Dashboard
- Real-time statistics and charts
- Management interface for all resources
- Forms for adding new items

## Troubleshooting
### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env file
- Whitelist IP in MongoDB Atlas if using cloud

### Frontend Build Issues
- Check Node.js version (v14+)
- Clear node_modules and reinstall
- Verify .env file configuration

### CORS Errors
- Ensure backend CORS is configured correctly
- Check frontend API URL in .env
- Verify ports are correct

## Deployment

### Backend Deployment
- Deploy to Heroku, Render, or AWS
- Set environment variables in production
- Use MongoDB Atlas for production database

### Frontend Deployment
- Build with npm run build
- Deploy to Vercel, Netlify, or AWS S3
- Update API URL in production .env

## **How to Run the Project**

1. **Start Backend:**
   
   ```
   cd backend
   npm install
   npm run seed
   npm run dev
   ```
2. **Start Frontend:**

   ```
   cd frontend
   npm install --legacy-peer-deps
   npm start
   ````
## Access the application:

**Open browser** 
```
http://localhost:3000
```

