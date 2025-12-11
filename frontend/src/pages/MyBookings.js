import React, { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = authService.getCurrentUser();


    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await bookingService.getUserBookings();
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {

        if (!user) {
            navigate('/login');
            return;
        }


        if (bookings.length === 0 && loading) {
            fetchBookings();
        }
    }, [user, navigate, fetchBookings, bookings, loading]);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            await bookingService.cancelBooking(bookingId);
            alert('Booking cancelled successfully');

            fetchBookings();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to cancel booking');
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        if (!status) return 'Unknown';

        switch (status.toLowerCase()) {
            case 'confirmed':
                return 'Confirmed';
            case 'pending':
                return 'Pending';
            case 'cancelled':
                return 'Cancelled';
            case 'completed':
                return 'Completed';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const calculateDuration = (startTime, endTime) => {
        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const durationHours = (end - start) / (1000 * 60 * 60);
            return durationHours.toFixed(1);
        } catch (error) {
            return 'N/A';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-600 mt-2">View and manage all your court bookings</p>

                    <button
                        onClick={() => navigate('/book')}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors duration-300"
                    >
                        + Book New Court
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Loading your bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                        <p className="text-gray-600 mb-6">You haven't made any court bookings yet.</p>
                        <button
                            onClick={() => navigate('/book')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300"
                        >
                            Book Your First Court
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {bookings.map(booking => (
                            <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between">
                                        <div className="mb-4 md:mb-0 md:flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    {booking.court?.name || 'Court Booking'}
                                                </h3>
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                                    {getStatusText(booking.status)}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-gray-600">
                                                <div className="flex items-start">
                                                    <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>
                                                        <strong>Date & Time:</strong> {formatDate(booking.startTime)}
                                                    </span>
                                                </div>

                                                <div className="flex items-start">
                                                    <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>
                                                        <strong>Duration:</strong> {calculateDuration(booking.startTime, booking.endTime)} hours
                                                    </span>
                                                </div>

                                                {booking.coach && (
                                                    <div className="flex items-start">
                                                        <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span>
                                                            <strong>Coach:</strong> {booking.coach.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right md:text-left md:pl-6">
                                            <div className="mb-4">
                                                <span className="text-2xl font-bold text-blue-600">
                                                    ₹{booking.pricingBreakdown.total?.toFixed(2) || booking.amount?.toFixed(2) || '0.00'}
                                                </span>
                                                <span className="text-gray-500 text-sm block">Total Amount</span>
                                            </div>

                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleCancelBooking(booking._id)}
                                                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-300"
                                                >
                                                    Cancel Booking
                                                </button>
                                            )}

                                            {booking.status === 'cancelled' && (
                                                <span className="text-sm text-gray-500">Booking cancelled</span>
                                            )}
                                        </div>
                                    </div>

                                    {booking.notes && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                            <p className="text-gray-700">
                                                <strong>Notes:</strong> {booking.notes}
                                            </p>
                                        </div>
                                    )}


                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">
                                            Booking ID: {booking._id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;