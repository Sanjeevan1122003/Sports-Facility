import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TimeSlotSelector from '../components/TimeSlotSelector';
import BookingForm from '../components/BookingForm';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';

const BookCourt = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        coachId: '',
        equipment: [],
        notes: ''
    });
    const [availableEquipment, setAvailableEquipment] = useState([]);
    const [availableCoaches, setAvailableCoaches] = useState([]);
    const hasFetchedRef = useRef(false);
    const user = authService.getCurrentUser();

    const fetchCourts = useCallback(async () => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        setLoading(true);
        setError(null);

        try {
            const response = await bookingService.getAllCourts();
            let courtsData = [];

            if (response?.data?.courts && Array.isArray(response.data.courts)) {
                courtsData = response.data.courts;
            } else if (Array.isArray(response?.data)) {
                courtsData = response.data;
            }

            if (courtsData && courtsData.length > 0) {
                const courtsWithNumbers = courtsData.map((court, index) => ({
                    ...court,
                    courtNumber: index + 1
                }));
                setCourts(courtsWithNumbers);
            } else {
                setError('No courts available.');
                setCourts([]);
            }

        } catch (error) {
            console.error('Error:', error);
            setError('Failed to load courts.');
            setCourts([]);
            hasFetchedRef.current = false;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (!hasFetchedRef.current && courts.length === 0) {
            fetchCourts();
        }
    }, [user, navigate, location.pathname, fetchCourts, courts.length]);


    useEffect(() => {
        const fetchBookingOptions = async () => {
            if (selectedSlot && selectedCourt?._id) {
                try {

                    const coachesResponse = await bookingService.getAvailableCoaches(
                        selectedCourt._id,
                        new Date(selectedSlot.startTime),
                        new Date(selectedSlot.endTime)
                    );
                    setAvailableCoaches(coachesResponse.data?.availableCoaches || []);


                    const equipmentResponse = await bookingService.getAvailableEquipment(
                        selectedCourt._id,
                        new Date(selectedSlot.startTime),
                        new Date(selectedSlot.endTime)
                    );
                    setAvailableEquipment(equipmentResponse.data?.availableEquipment || []);
                } catch (error) {
                    console.error('Error fetching booking options:', error);
                }
            }
        };

        if (step === 3) {
            fetchBookingOptions();
        }
    }, [selectedSlot, selectedCourt, step]);

    const selectCourt = (courtId) => {
        const court = courts.find(c => c._id === courtId);
        if (court) {
            setSelectedCourt(court);
            setStep(2);
        }
    };

    const handleSlotSelect = (slot) => {
        if (!slot || !slot.startTime || !slot.endTime) {
            setError('Invalid time slot selected. Please try again.');
            return;
        }
        setSelectedSlot(slot);
        setError(null);
        setFormData({
            coachId: '',
            equipment: [],
            notes: ''
        });
        setStep(3);
    };

    const handleFormUpdate = useCallback((newFormData) => {
        setFormData(newFormData);
    }, []);

    const handleBookingComplete = (bookingData) => {
        alert('Booking confirmed successfully!');
        navigate('/my-bookings');
    };


    const calculateCourtCost = () => {
        if (!selectedCourt || !selectedSlot) return 0;
        const start = new Date(selectedSlot.startTime);
        const end = new Date(selectedSlot.endTime);
        const duration = (end - start) / (1000 * 60 * 60);
        return selectedCourt.basePrice * duration;
    };


    const calculateCoachCost = () => {
        if (!formData.coachId || !selectedSlot) return 0;

        const selectedCoach = availableCoaches.find(c => c._id === formData.coachId);
        if (!selectedCoach) return 0;

        const start = new Date(selectedSlot.startTime);
        const end = new Date(selectedSlot.endTime);
        const duration = (end - start) / (1000 * 60 * 60);

        return selectedCoach.hourlyRate * duration;
    };


    const calculateEquipmentCost = () => {
        if (!selectedSlot || !formData.equipment || formData.equipment.length === 0) return 0;

        const start = new Date(selectedSlot.startTime);
        const end = new Date(selectedSlot.endTime);
        const duration = (end - start) / (1000 * 60 * 60);

        return formData.equipment.reduce((total, item) => {
            const equipmentItem = availableEquipment.find(e => e._id === item.equipment);
            if (equipmentItem) {
                return total + (equipmentItem.hourlyRate * duration * item.quantity);
            }
            return total;
        }, 0);
    };


    const calculateTotalCost = () => {
        return calculateCourtCost() + calculateCoachCost() + calculateEquipmentCost();
    };


    const getSelectedCoach = () => {
        if (!formData.coachId) return null;
        return availableCoaches.find(c => c._id === formData.coachId);
    };


    const getSelectedEquipmentItems = () => {
        return formData.equipment.map(item => {
            const equipmentItem = availableEquipment.find(e => e._id === item.equipment);
            return equipmentItem ? {
                ...equipmentItem,
                quantity: item.quantity
            } : null;
        }).filter(Boolean);
    };

    const getDuration = () => {
        if (!selectedSlot) return 0;
        const start = new Date(selectedSlot.startTime);
        const end = new Date(selectedSlot.endTime);
        return (end - start) / (1000 * 60 * 60);
    };

    const goBack = () => {
        if (step > 1) {
            setStep(step - 1);
            if (step === 3) {
                setSelectedSlot(null);
                setFormData({
                    coachId: '',
                    equipment: [],
                    notes: ''
                });
            }
        }
    };

    const goToCourtSelection = () => {
        setStep(1);
        setSelectedSlot(null);
        setFormData({
            coachId: '',
            equipment: [],
            notes: ''
        });
    };

    const retryFetch = () => {
        hasFetchedRef.current = false;
        setError(null);
        fetchCourts();
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        {[1, 2, 3].map((stepNumber) => (
                            <React.Fragment key={stepNumber}>
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= stepNumber
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {stepNumber}
                                </div>
                                {stepNumber < 3 && (
                                    <div className={`w-24 h-1 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4">
                        <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            Select Court
                        </span>
                        <span className={`text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            Choose Time
                        </span>
                        <span className={`text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                            Confirm Booking
                        </span>
                    </div>
                </div>


                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6">

                        {step === 1 && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Court</h2>

                                {loading ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                        <p className="mt-4 text-gray-600">Loading courts...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-12">
                                        <p className="text-red-500 mb-4">{error}</p>
                                        <button
                                            onClick={retryFetch}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : courts.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {courts.map((court) => (
                                            <button
                                                key={court._id}
                                                onClick={() => selectCourt(court._id)}
                                                className="flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-gray-100 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                            >

                                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-700 text-2xl font-bold mb-4">
                                                    {court.courtNumber}
                                                </div>


                                                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                                                    {court.name}
                                                </h3>


                                                <div className="mb-3">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                        {court.type}
                                                    </span>
                                                </div>


                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Price per hour</p>
                                                    <p className="text-xl font-bold text-blue-600">
                                                        ₹{court.basePrice}
                                                    </p>
                                                </div>


                                                <div className="mt-4 w-full">
                                                    <div className="text-center text-blue-600 font-medium">
                                                        Select →
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 mb-4">No courts available.</p>
                                        <button
                                            onClick={retryFetch}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Refresh
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}


                        {step === 2 && selectedCourt && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Select Time for {selectedCourt.name}
                                        </h2>
                                        <p className="text-gray-600">Base rate: ₹{selectedCourt.basePrice}/hour</p>
                                    </div>
                                    <button
                                        onClick={goToCourtSelection}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        ← Change Court
                                    </button>
                                </div>
                                <TimeSlotSelector
                                    courtId={selectedCourt._id}
                                    onSlotSelect={handleSlotSelect}
                                />
                            </div>
                        )}


                        {step === 3 && selectedCourt && selectedSlot && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Confirm Booking</h2>
                                        <p className="text-gray-600">Complete your booking details</p>
                                    </div>
                                    <button
                                        onClick={goBack}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        ← Change Time
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                                    <div className="lg:col-span-2">
                                        <BookingForm
                                            court={selectedCourt}
                                            selectedSlot={selectedSlot}
                                            onBookingComplete={handleBookingComplete}
                                            onFormUpdate={handleFormUpdate}
                                        />
                                    </div>


                                    <div className="lg:col-span-1">
                                        <div className="bg-gray-50 p-6 rounded-lg shadow-sm sticky top-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
                                            <div className="space-y-4">

                                                <div className="pb-3 border-b border-gray-200">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-gray-600">Court:</span>
                                                        <span className="font-medium">{selectedCourt.name}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Type:</span>
                                                        <span className="font-medium">{selectedCourt.type}</span>
                                                    </div>
                                                </div>


                                                <div className="pb-3 border-b border-gray-200">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-gray-600">Date:</span>
                                                        <span className="font-medium">
                                                            {new Date(selectedSlot.startTime).toLocaleDateString('en-IN', {
                                                                weekday: 'short',
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-gray-600">Time:</span>
                                                        <span className="font-medium">
                                                            {selectedSlot.formattedTime ||
                                                                `${new Date(selectedSlot.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(selectedSlot.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Duration:</span>
                                                        <span className="font-medium">
                                                            {getDuration().toFixed(1)} hours
                                                        </span>
                                                    </div>
                                                </div>


                                                <div className="pb-3 border-b border-gray-200">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <span className="text-gray-600">Court Fee</span>
                                                            <p className="text-xs text-gray-500">
                                                                ₹{selectedCourt.basePrice}/hour × {getDuration().toFixed(1)} hours
                                                            </p>
                                                        </div>
                                                        <span className="font-medium">
                                                            ₹{calculateCourtCost().toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>


                                                {formData.coachId && (
                                                    <div className="pb-3 border-b border-gray-200">
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <span className="text-gray-600">Coach</span>
                                                                <p className="text-xs text-gray-500">
                                                                    {getSelectedCoach()?.name}
                                                                    {getSelectedCoach()?.hourlyRate && ` (₹${getSelectedCoach()?.hourlyRate}/hour)`}
                                                                </p>
                                                            </div>
                                                            <span className="font-medium text-green-600">
                                                                +₹{calculateCoachCost().toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}


                                                {getSelectedEquipmentItems().map((item, index) => (
                                                    <div key={item._id || index} className="pb-3 border-b border-gray-200">
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <span className="text-gray-600">{item.name}</span>
                                                                <p className="text-xs text-gray-500">
                                                                    {item.quantity} item(s) × ₹{item.hourlyRate}/hour
                                                                </p>
                                                            </div>
                                                            <span className="font-medium text-green-600">
                                                                +₹{(item.hourlyRate * item.quantity * getDuration()).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}


                                                <div className="pt-3">
                                                    <div className="flex justify-between text-lg font-semibold">
                                                        <span>Total Amount:</span>
                                                        <span className="text-blue-600">
                                                            ₹{calculateTotalCost().toFixed(2)}
                                                        </span>
                                                    </div>


                                                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                                                        <p className="text-sm font-medium text-blue-800 mb-1">Cost Breakdown:</p>
                                                        <ul className="text-xs text-blue-700 space-y-1">
                                                            <li className="flex justify-between">
                                                                <span>Court:</span>
                                                                <span>₹{calculateCourtCost().toFixed(2)}</span>
                                                            </li>
                                                            {formData.coachId && (
                                                                <li className="flex justify-between">
                                                                    <span>Coach:</span>
                                                                    <span>+₹{calculateCoachCost().toFixed(2)}</span>
                                                                </li>
                                                            )}
                                                            {getSelectedEquipmentItems().length > 0 && (
                                                                <li className="flex justify-between">
                                                                    <span>Equipment:</span>
                                                                    <span>+₹{calculateEquipmentCost().toFixed(2)}</span>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>


                                                    <div className="mt-4 text-xs text-gray-500">
                                                        <p className="mb-1">✓ All prices include taxes</p>
                                                        <p>✓ Free cancellation up to 24 hours before booking</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookCourt;