import React, { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services/bookingService';

const BookingForm = ({ court, selectedSlot, onBookingComplete, onFormUpdate }) => {
    const [equipment, setEquipment] = useState([]);
    const [availableCoaches, setAvailableCoaches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingCoaches, setLoadingCoaches] = useState(false);
    const [loadingEquipment, setLoadingEquipment] = useState(false);
    const [formError, setFormError] = useState(null);
    const [coachError, setCoachError] = useState(null);
    const [equipmentError, setEquipmentError] = useState(null);

    const [formData, setFormData] = useState(() => ({
        coachId: '',
        equipment: [],
        notes: '',
        courtId: court?._id || '',
        startTime: selectedSlot ? new Date(selectedSlot.startTime).toISOString() : '',
        endTime: selectedSlot ? new Date(selectedSlot.endTime).toISOString() : ''
    }));


    const debouncedUpdate = useCallback(() => {
        if (onFormUpdate && typeof onFormUpdate === 'function') {
            onFormUpdate(formData);
        }
    }, [formData, onFormUpdate]);


    const initialMount = React.useRef(true);


    useEffect(() => {
        if (initialMount.current) {
            initialMount.current = false;
        } else {
            debouncedUpdate();
        }
    }, [formData, debouncedUpdate]);


    useEffect(() => {
        if (selectedSlot) {
            const newFormData = {
                coachId: '',
                equipment: [],
                notes: '',
                courtId: court?._id || '',
                startTime: new Date(selectedSlot.startTime).toISOString(),
                endTime: new Date(selectedSlot.endTime).toISOString()
            };
            setFormData(newFormData);
            setCoachError(null);
            setEquipmentError(null);
        }
    }, [selectedSlot, court]);


    useEffect(() => {
        const fetchData = async () => {
            if (!selectedSlot || !court?._id) return;

            try {

                setLoadingCoaches(true);
                const coachesResponse = await bookingService.getAvailableCoaches(
                    court._id,
                    new Date(selectedSlot.startTime),
                    new Date(selectedSlot.endTime)
                );
                setAvailableCoaches(coachesResponse.data?.availableCoaches || []);
                if (coachesResponse.data?.availableCoaches?.length === 0) {
                    setCoachError('No coaches available for this time slot. You can still book the court without a coach.');
                }
            } catch (error) {
                console.error('Error fetching available coaches:', error);
                setAvailableCoaches([]);
                setCoachError('Unable to load coaches. You can still book the court.');
            } finally {
                setLoadingCoaches(false);
            }

            try {

                setLoadingEquipment(true);
                const equipmentResponse = await bookingService.getAvailableEquipment(
                    court._id,
                    new Date(selectedSlot.startTime),
                    new Date(selectedSlot.endTime)
                );
                setEquipment(equipmentResponse.data?.availableEquipment || []);
                if (equipmentResponse.data?.availableEquipment?.length === 0) {
                    setEquipmentError('No equipment available for this time slot.');
                }
            } catch (error) {
                console.error('Error fetching available equipment:', error);
                setEquipment([]);
                setEquipmentError('Unable to load equipment.');
            } finally {
                setLoadingEquipment(false);
            }
        };

        fetchData();
    }, [selectedSlot, court]);


    const handleCoachChange = useCallback((coachId) => {
        setFormData(prev => ({ ...prev, coachId }));
    }, []);

    const handleNotesChange = useCallback((notes) => {
        setFormData(prev => ({ ...prev, notes }));
    }, []);

    const handleEquipmentChange = useCallback((equipmentId, quantity) => {
        setFormData(prev => {
            const existingIndex = prev.equipment.findIndex(item => item.equipment === equipmentId);
            let newEquipment = [...prev.equipment];

            if (existingIndex >= 0) {
                if (quantity === 0) {
                    newEquipment.splice(existingIndex, 1);
                } else {
                    newEquipment[existingIndex] = { equipment: equipmentId, quantity };
                }
            } else if (quantity > 0) {
                newEquipment.push({ equipment: equipmentId, quantity });
            }

            return { ...prev, equipment: newEquipment };
        });
    }, []);

    const handleAddEquipment = useCallback((equipmentId) => {
        handleEquipmentChange(equipmentId, 1);
    }, [handleEquipmentChange]);

    const handleRemoveEquipment = useCallback((equipmentId) => {
        handleEquipmentChange(equipmentId, 0);
    }, [handleEquipmentChange]);

    const updateEquipmentQuantity = useCallback((equipmentId, newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveEquipment(equipmentId);
        } else {
            handleEquipmentChange(equipmentId, newQuantity);
        }
    }, [handleEquipmentChange, handleRemoveEquipment]);

    const getEquipmentQuantity = useCallback((equipmentId) => {
        const item = formData.equipment.find(item => item.equipment === equipmentId);
        return item ? item.quantity : 0;
    }, [formData.equipment]);

    const isEquipmentSelected = useCallback((equipmentId) => {
        return formData.equipment.some(item => item.equipment === equipmentId);
    }, [formData.equipment]);

    const getSelectedEquipmentItems = useCallback(() => {
        return formData.equipment.map(item => {
            const equipmentItem = equipment.find(e => e._id === item.equipment);
            return {
                ...equipmentItem,
                quantity: item.quantity
            };
        }).filter(Boolean);
    }, [formData.equipment, equipment]);


    const validateBookingTime = (startTime, endTime) => {
        const now = new Date();
        const bookingStart = new Date(startTime);
        const bookingEnd = new Date(endTime);

        if (bookingEnd <= now) {
            return 'Cannot book past time slots. Please select a future time.';
        }

        const timeDiff = bookingStart.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        if (minutesDiff < 30) {
            return 'Please book at least 30 minutes in advance.';
        }

        return null;
    };

    const validateEquipment = () => {
        for (const item of formData.equipment) {
            const equipmentItem = equipment.find(e => e._id === item.equipment);
            if (equipmentItem && item.quantity > equipmentItem.availableCount) {
                return `Only ${equipmentItem.availableCount} ${equipmentItem.name}(s) available. Please reduce quantity.`;
            }
        }
        return null;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormError(null);


        const timeError = validateBookingTime(formData.startTime, formData.endTime);
        if (timeError) {
            setFormError(timeError);
            setLoading(false);
            return;
        }


        if (!formData.courtId || !formData.startTime || !formData.endTime) {
            setFormError('Missing required booking information');
            setLoading(false);
            return;
        }


        if (formData.coachId) {
            const selectedCoach = availableCoaches.find(c => c._id === formData.coachId);
            if (!selectedCoach) {
                setFormError('Selected coach is no longer available. Please select another coach.');
                setLoading(false);
                return;
            }
        }


        const equipmentError = validateEquipment();
        if (equipmentError) {
            setFormError(equipmentError);
            setLoading(false);
            return;
        }

        try {
            const bookingData = {
                courtId: formData.courtId,
                startTime: formData.startTime,
                endTime: formData.endTime,
                notes: formData.notes?.trim() || undefined,
                coachId: formData.coachId || undefined,
                equipment: formData.equipment.length > 0 ? formData.equipment : undefined
            };

            const response = await bookingService.createBooking(bookingData);
            onBookingComplete(response.data);
        } catch (error) {
            console.error('Error creating booking:', error);
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Failed to create booking. Please try again.';


            if (errorMessage.includes('Coach')) {
                setFormData(prev => ({ ...prev, coachId: '' }));
                setCoachError(errorMessage);
            }
            if (errorMessage.includes('Equipment') || errorMessage.includes('equipment')) {
                setFormData(prev => ({ ...prev, equipment: [] }));
                setEquipmentError(errorMessage);
            }

            setFormError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add a Coach (Optional)
                </label>

                {loadingCoaches ? (
                    <div className="p-3 bg-gray-100 rounded-lg text-center">
                        <span className="text-gray-600">Loading available coaches...</span>
                    </div>
                ) : coachError ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-700 text-sm">{coachError}</p>
                    </div>
                ) : null}

                <select
                    value={formData.coachId}
                    onChange={(e) => handleCoachChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={loadingCoaches}
                >
                    <option value="">No Coach (Book Court Only)</option>
                    {availableCoaches.map(coach => (
                        <option key={coach._id} value={coach._id}>
                            {coach.name}
                            {coach.rating > 0 && ` ⭐ ${coach.rating}`}
                            {coach.experience > 0 && ` (${coach.experience} yrs)`}
                            {coach.sportSpecialization?.length > 0 && ` - ${coach.sportSpecialization.join(', ')}`}
                            {` - ₹${coach.hourlyRate}/hour`}
                        </option>
                    ))}
                </select>
            </div>


            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rent Equipment (Optional)
                </label>

                {loadingEquipment ? (
                    <div className="p-3 bg-gray-100 rounded-lg text-center">
                        <span className="text-gray-600">Loading available equipment...</span>
                    </div>
                ) : equipmentError ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-700 text-sm">{equipmentError}</p>
                    </div>
                ) : null}

                <div className="space-y-3">

                    <div>
                        <select
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId) {
                                    handleAddEquipment(selectedId);
                                    e.target.value = '';
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={loadingEquipment}
                        >
                            <option value="">Select equipment to add...</option>
                            {equipment
                                .filter(item => !isEquipmentSelected(item._id))
                                .map(item => (
                                    <option key={item._id} value={item._id}>
                                        {item.name} - ₹{item.hourlyRate}/hour
                                        {item.availableCount > 0 && ` (${item.availableCount} available)`}
                                    </option>
                                ))
                            }
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Select equipment from the dropdown to add it to your booking
                        </p>
                    </div>


                    <div className="space-y-2">
                        {getSelectedEquipmentItems().map(item => (
                            <div key={item._id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                                        <p className="text-sm text-gray-600">{item.description}</p>
                                        <p className="text-sm font-medium text-gray-700">
                                            ₹{item.hourlyRate}/hour per item
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => updateEquipmentQuantity(item._id, getEquipmentQuantity(item._id) - 1)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={getEquipmentQuantity(item._id) <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-medium">
                                                {getEquipmentQuantity(item._id)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateEquipmentQuantity(item._id, getEquipmentQuantity(item._id) + 1)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={getEquipmentQuantity(item._id) >= item.availableCount}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEquipment(item._id)}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>


                    {formData.equipment.length === 0 && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                            <p className="text-gray-500">No equipment selected. Use the dropdown above to add equipment.</p>
                        </div>
                    )}
                </div>
            </div>


            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                </label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special requirements or notes..."
                />
            </div>


            {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{formError}</p>
                </div>
            )}


            <button
                type="submit"
                disabled={loading || !selectedSlot}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-md text-center font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
                {loading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </span>
                ) : 'Confirm Booking'}
            </button>
        </form>
    );
};

export default BookingForm;