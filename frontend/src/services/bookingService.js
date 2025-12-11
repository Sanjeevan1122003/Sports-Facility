import api from './api';

export const bookingService = {
    createBooking: (bookingData) => {
        return api.post('/bookings', bookingData);
    },

    getUserBookings: () => {
        return api.get('/bookings/my-bookings');
    },

    cancelBooking: (bookingId) => {
        return api.put(`/bookings/${bookingId}/cancel`);
    },

    checkAvailability: (courtId, date, duration) => {
        return api.get('/bookings/availability', {
            params: { courtId, date: date.toISOString(), duration }
        });
    },

    checkCoachAvailability: (coachId, startTime, endTime) => {
        return api.get('/bookings/coach-availability', {
            params: {
                coachId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            }
        });
    },

    getAllCoaches: () => {
        return api.get('/coaches');
    },

    getAvailableCoaches: (courtId, startTime, endTime) => {
        return api.get('/coaches/available', {
            params: {
                courtId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            }
        });
    },

    getAvailableEquipment: (courtId, startTime, endTime) => {
        return api.get('/bookings/available-equipment', {
            params: {
                courtId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            },
        })
    },

    getAllCourts: () => {
        return api.get('/courts');
    },

    getCourtById: (courtId) => {
        return api.get(`/courts/${courtId}`);
    }
};