import React from 'react';
import { Link } from 'react-router-dom';

const CourtCard = ({ court }) => {
    return (
        <div className="court-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">{court.name}</h3>
                        <div className="mt-2 flex items-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium₹{court.type === 'indoor'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                {court.type.charAt(0).toUpperCase() + court.type.slice(1)}
                            </span>
                            <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                {court.sportType}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary-600">
                           ₹{court.basePrice}
                        </span>
                        <span className="text-gray-500 text-sm block">per hour</span>
                    </div>
                </div>

                <p className="mt-4 text-gray-600">{court.description}</p>

                {court.amenities && court.amenities.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">Amenities</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {court.amenities.map((amenity, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                                >
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    <Link
                        to={`/book?court=${court._id}`}
                        className="w-full bg-primary-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-primary-700 transition-colors duration-300 block"
                    >
                        Book Now
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CourtCard;