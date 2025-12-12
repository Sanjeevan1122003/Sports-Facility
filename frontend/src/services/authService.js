import api from './api';
import Cookies from 'js-cookie';

export const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            Cookies.set('token', response.data.token, { 
                expires: 90,
                secure: true, 
                sameSite: 'Lax'
            });
            Cookies.set('user', JSON.stringify(response.data.user),{ 
                expires: 90,
                secure: true, 
                sameSite: 'Lax'
            });
        }
        return response.data;
    },

    logout: () => {
        Cookies.remove('token');
        Cookies.remove('user');
        window.location.href = '/login';
    },

    getCurrentUser: () => {
        const user = Cookies.get('user');
        return user ? JSON.parse(user) : null;
    },

    getToken: () => {
        return Cookies.get('token');
    }
};
