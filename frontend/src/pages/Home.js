import React, { useState, useEffect } from 'react';
import CourtCard from '../components/CourtCard';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';

const Home = () => {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchCourts();
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
    }, []);

    const fetchCourts = async () => {
        setLoading(true);
        try {
            const response = await bookingService.getAllCourts();
            setCourts(response.data.courts || []);
        } catch (error) {
            console.error('Error fetching courts:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Book Your Perfect Court
                        </h1>
                        <p className="text-xl mb-8 max-w-2xl mx-auto">
                            Experience world-class sports facilities with easy online booking,
                            real-time availability, and dynamic pricing.
                        </p>
                        {!user && (
                            <div className="space-x-4">
                                <a
                                    href="/register"
                                    className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
                                >
                                    Get Started
                                </a>
                                <a
                                    href="/book"
                                    className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors duration-300"
                                >
                                    Browse Courts
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Available Courts
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Choose from our premium selection of indoor and outdoor courts,
                        each equipped with professional-grade facilities.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="loading-spinner w-12 h-12"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courts.map(court => (
                            <CourtCard key={court._id} court={court} />
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Real-time Availability
                            </h3>
                            <p className="text-gray-600">
                                See live court availability and book instantly without any delays.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Dynamic Pricing
                            </h3>
                            <p className="text-gray-600">
                                Get the best prices with our smart pricing engine that adjusts based on demand.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Easy Management
                            </h3>
                            <p className="text-gray-600">
                                Manage all your bookings from one dashboard with easy cancellation options.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;