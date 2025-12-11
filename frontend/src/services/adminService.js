import api from './api';

export const adminService = {

    getDashboardStats: () => {
        return api.get('/admin/dashboard/stats');
    },


    getAllCoaches: (params = {}) => {
        return api.get('/admin/coaches', { params });
    },

    getCoachById: (coachId) => {
        return api.get(`/admin/coaches/${coachId}`);
    },

    createCoach: (coachData) => {
        return api.post('/admin/coaches', coachData);
    },

    updateCoach: (coachId, coachData) => {
        return api.put(`/admin/coaches/${coachId}`, coachData);
    },

    deleteCoach: (coachId) => {
        return api.delete(`/admin/coaches/${coachId}`);
    },

    updateCoachAvailability: (coachId, availability) => {
        return api.put(`/admin/coaches/${coachId}/availability`, { availability });
    },

    updateCoachStatus: (coachId, status) => {
        return api.put(`/admin/coaches/${coachId}/status`, { status });
    },

    updateCoachRate: (coachId, hourlyRate) => {
        return api.put(`/admin/coaches/${coachId}/rate`, { hourlyRate });
    },

    getCoachStats: (coachId) => {
        return api.get(`/admin/coaches/${coachId}/stats`);
    },

    bulkUpdateCoaches: (updates) => {
        return api.post('/admin/coaches/bulk-update', { updates });
    },


    getAllPricingRules: () => {
        return api.get('/admin/pricing-rules');
    },

    createPricingRule: (ruleData) => {
        return api.post('/admin/pricing-rules', ruleData);
    },

    updatePricingRule: (ruleId, ruleData) => {
        return api.put(`/admin/pricing-rules/${ruleId}`, ruleData);
    },

    deletePricingRule: (ruleId) => {
        return api.delete(`/admin/pricing-rules/${ruleId}`);
    },

    getAllEquipment: () => {
        return api.get('/admin/equipment');
    },

    createEquipment: (equipmentData) => {
        return api.post('/admin/equipment', equipmentData);
    },

    updateEquipment: (equipmentId, equipmentData) => {
        return api.put(`/admin/equipment/${equipmentId}`, equipmentData);
    },

    deleteEquipment: (equipmentId) => {
        return api.delete(`/admin/equipment/${equipmentId}`);
    },

    getAllCourts: () => {
        return api.get('/admin/courts');
    },

    createCourt: (courtData) => {
        return api.post('/admin/courts', courtData);
    },

    updateCourt: (courtId, courtData) => {
        return api.put(`/admin/courts/${courtId}`, courtData);
    },

    deleteCourt: (courtId) => {
        return api.delete(`/admin/courts/${courtId}`);
    },


    getAllUsers: (params = {}) => {
        return api.get('/admin/users', { params });
    },

    updateUserStatus: (userId, status) => {
        return api.put(`/admin/users/${userId}/status`, { status });
    },


    getAllBookings: (params = {}) => {
        return api.get('/admin/bookings', { params });
    },

    updateBookingStatus: (bookingId, status) => {
        return api.put(`/admin/bookings/${bookingId}/status`, { status });
    }
};

