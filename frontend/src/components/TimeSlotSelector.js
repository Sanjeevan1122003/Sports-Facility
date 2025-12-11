import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { bookingService } from '../services/bookingService';

const TimeSlotSelector = ({ courtId, onSlotSelect }) => {
    const [selectedDate, setSelectedDate] = useState(() => {

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [duration, setDuration] = useState(1);

    const fetchTimeSlots = useCallback(async () => {
        if (!courtId) return;

        setLoading(true);
        setError(null);

        try {

            const now = new Date();
            const selectedDateOnly = new Date(selectedDate);
            selectedDateOnly.setHours(0, 0, 0, 0);
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);

            if (selectedDateOnly < today) {
                setError('Cannot select past dates. Please choose today or a future date.');
                setTimeSlots([]);
                return;
            }

            const response = await bookingService.checkAvailability(
                courtId,
                selectedDate,
                duration
            );


            const nowTime = now.getTime();
            const filteredSlots = (response.data.timeSlots || []).filter(slot => {
                const slotStartTime = new Date(slot.startTime).getTime();
                return slotStartTime > nowTime;
            });

            setTimeSlots(filteredSlots);

            if (filteredSlots.length === 0) {
                setError('No available slots for the selected date and time.');
            }
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setError('Failed to load time slots. Please try again.');
            setTimeSlots([]);
        } finally {
            setLoading(false);
        }
    }, [courtId, selectedDate, duration]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            fetchTimeSlots();
        }, 300);

        return () => clearTimeout(timerId);
    }, [fetchTimeSlots]);

    const handleSlotClick = (slot) => {
        if (slot.isAvailable) {

            const slotStartTime = new Date(slot.startTime).getTime();
            const now = new Date().getTime();

            if (slotStartTime <= now) {
                setError('Cannot select past time slots. Please choose a future time.');
                return;
            }

            setSelectedSlot(slot);
            setError(null);
            onSlotSelect(slot);
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isToday = (date) => {
        const today = new Date();
        const checkDate = new Date(date);
        return checkDate.toDateString() === today.toDateString();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time Slot</h3>

            
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                </label>
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                    }}
                    minDate={new Date()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    dateFormat="d, MMMM, yyyy"
                />
                <p className="text-xs text-gray-500 mt-1">
                    {isToday(selectedDate)
                        ? "Today - Showing available time slots from now onwards"
                        : "Select a future date to see available time slots"}
                </p>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours)
                </label>
                <select
                    value={duration}
                    onChange={(e) => {
                        setDuration(parseFloat(e.target.value));
                        setSelectedSlot(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value={0.5}>30 minutes</option>
                    <option value={1}>1 hour</option>
                    <option value={1.5}>1.5 hours</option>
                    <option value={2}>2 hours</option>
                    <option value={2.5}>2.5 hours</option>
                    <option value={3}>3 hours</option>
                </select>
            </div>

            <div className="mb-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">
                    Available slots for {formatDate(selectedDate)}
                </h4>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : timeSlots.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">
                            {isToday(selectedDate)
                                ? "No available slots for today. Please try another date or duration."
                                : "No available slots for the selected date. Please try another date or duration."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {timeSlots.map((slot, index) => {
                            const slotStartTime = new Date(slot.startTime);
                            const slotEndTime = new Date(slot.endTime);
                            const now = new Date();
                            const isPastSlot = slotStartTime <= now;
                            const isSlotToday = slotStartTime.toDateString() === now.toDateString();


                            if (isSlotToday && isPastSlot) {
                                return null;
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSlotClick(slot)}
                                    className={`time-slot p-3 rounded-lg border-2 text-center transition-all duration-200 ${selectedSlot === slot
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : slot.isAvailable && !isPastSlot
                                            ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!slot.isAvailable || isPastSlot}
                                >
                                    <div className="font-medium">
                                        {slotStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {' - '}
                                        {slotEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-xs mt-1">
                                        {!slot.isAvailable ? (
                                            <span className="text-red-600">Booked</span>
                                        ) : isPastSlot ? (
                                            <span className="text-amber-600">Past</span>
                                        ) : (
                                            <span className="text-green-600">Available</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedSlot && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-medium text-blue-900">Selected Slot</h4>
                            <p className="text-sm text-blue-700">
                                {formatDate(new Date(selectedSlot.startTime))}<br />
                                {new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({duration} hour{duration > 1 ? 's' : ''})
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedSlot(null);
                                onSlotSelect(null);
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotSelector;