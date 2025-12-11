import React, { useState, useEffect, useCallback } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from 'recharts';
import "react-datepicker/dist/react-datepicker.css";
import {
    People as PeopleIcon,
    SportsTennis as CourtIcon,
    AttachMoney as MoneyIcon,
    Schedule as ScheduleIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Star as StarIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Visibility as ViewIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    SportsBasketball as BasketballIcon,
    SportsTennis as TennisIcon,
    Sports as SquashIcon
} from '@mui/icons-material';
import { adminService } from '../services/adminService';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        totalRevenue: 0,
        todaysBookings: 0,
        activeUsers: 0,
        availableCourts: 0,
        activeCoaches: 0,
        totalEquipment: 0
    });

    const [recentBookings, setRecentBookings] = useState([]);
    const [pricingRules, setPricingRules] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [courts, setCourts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const [editingCoach, setEditingCoach] = useState(null);
    const [showEditCoachModal, setShowEditCoachModal] = useState(false);
    const [showCoachStatsModal, setShowCoachStatsModal] = useState(false);
    const [selectedCoachStats, setSelectedCoachStats] = useState(null);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [coachAvailability, setCoachAvailability] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [coachToDelete, setCoachToDelete] = useState(null);

    const [newRule, setNewRule] = useState({
        name: '',
        type: 'peak_hour',
        description: '',
        multiplier: 1.0,
        startTime: '',
        endTime: '',
        dayOfWeek: [],
        isActive: true
    });

    const [newEquipment, setNewEquipment] = useState({
        name: '',
        type: 'racket',
        totalStock: 0,
        rentalPrice: 0,
        description: ''
    });

    const [newCoach, setNewCoach] = useState({
        name: '',
        email: '',
        phone: '',
        sportSpecialization: ['badminton'],
        hourlyRate: 250,
        experience: 1,
        description: '',
        status: 'available',
        availability: []
    });

    const [newCourt, setNewCourt] = useState({
        name: '',
        type: 'indoor',
        sportType: 'badminton',
        basePrice: 2000,
        description: '',
        amenities: []
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                statsRes,
                rulesRes,
                equipmentRes,
                coachesRes,
                courtsRes,
                bookingsRes,
                usersRes
            ] = await Promise.all([
                adminService.getDashboardStats(),
                adminService.getAllPricingRules(),
                adminService.getAllEquipment(),
                adminService.getAllCoaches(),
                adminService.getAllCourts(),
                adminService.getAllBookings({ limit: 5 }),
                adminService.getAllUsers({ limit: 5 })
            ]);

            if (statsRes.data && statsRes.data.stats) {
                setStats(statsRes.data.stats);
            } else {
                const totalBookings = bookingsRes.data?.bookings?.length || 0;
                const confirmedBookings = bookingsRes.data?.bookings?.filter(b => b.status === 'confirmed').length || 0;
                const totalRevenue = bookingsRes.data?.bookings?.reduce((sum, b) => sum + (b.pricingBreakdown?.total || 0), 0) || 0;
                const activeCoaches = coachesRes.data?.coaches?.filter(c => c.status === 'available').length || 0;
                const availableCourts = courtsRes.data?.courts?.filter(c => c.status === 'active').length || 0;
                const totalEquipment = equipmentRes.data?.equipment?.reduce((sum, e) => sum + (e.totalStock || 0), 0) || 0;

                setStats({
                    totalBookings,
                    confirmedBookings,
                    totalRevenue,
                    todaysBookings: 0,
                    activeUsers: usersRes.data?.users?.length || 0,
                    availableCourts,
                    activeCoaches,
                    totalEquipment
                });
            }

            setRecentBookings(bookingsRes.data?.bookings || []);
            setPricingRules(rulesRes.data?.pricingRules || []);
            setEquipment(equipmentRes.data?.equipment || []);
            setCoaches(coachesRes.data?.coaches || []);
            setCourts(courtsRes.data?.courts || []);


        } catch (error) {
            alert('Failed to load dashboard data. Please check your API endpoints.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const generateRevenueData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        return months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => ({
            month,
            revenue: Math.floor(Math.random() * 6000) + 3000
        }));
    };

    const revenueData = generateRevenueData();

    const generateBookingTypeData = () => {
        const sportCounts = {};
        courts.forEach(court => {
            const sport = court.sportType;
            sportCounts[sport] = (sportCounts[sport] || 0) + 1;
        });

        return Object.entries(sportCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: value * 15
        }));
    };

    const bookingTypeData = generateBookingTypeData();

    const handleCreateCoach = async (e) => {
        e.preventDefault();
        try {
            await adminService.createCoach(newCoach);
            alert('Coach added successfully!');
            setNewCoach({
                name: '',
                email: '',
                phone: '',
                sportSpecialization: ['badminton'],
                hourlyRate: 250,
                experience: 1,
                description: '',
                status: 'available',
                availability: []
            });
            fetchDashboardData();
        } catch (error) {
            alert('Error adding coach: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleEditCoach = (coach) => {
        setEditingCoach({ ...coach });
        setShowEditCoachModal(true);
    };

    const handleUpdateCoach = async (e) => {
        e.preventDefault();
        try {
            await adminService.updateCoach(editingCoach._id, editingCoach);
            alert('Coach updated successfully!');
            setShowEditCoachModal(false);
            fetchDashboardData();
        } catch (error) {
            alert('Error updating coach: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteCoach = async () => {
        try {
            await adminService.deleteCoach(coachToDelete);
            alert('Coach deleted successfully!');
            setShowDeleteConfirm(false);
            fetchDashboardData();
        } catch (error) {
            alert('Error deleting coach: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateCoachStatus = async (coachId, currentStatus) => {
        const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
        try {
            await adminService.updateCoachStatus(coachId, newStatus);
            alert(`Coach status updated to ${newStatus}`);
            fetchDashboardData();
        } catch (error) {
            alert('Error updating coach status: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateCoachRate = async (coachId, currentRate) => {
        const newRate = prompt('Enter new hourly rate:', currentRate);
        if (newRate && !isNaN(newRate) && parseFloat(newRate) > 0) {
            try {
                await adminService.updateCoachRate(coachId, parseFloat(newRate));
                alert('Coach hourly rate updated successfully!');
                fetchDashboardData();
            } catch (error) {
                alert('Error updating coach rate: ' + (error.response?.data?.error || error.message));
            }
        }
    };

    const handleViewCoachStats = async (coachId) => {
        try {
            const response = await adminService.getCoachStats(coachId);
            setSelectedCoachStats(response.data.stats);
            setShowCoachStatsModal(true);
        } catch (error) {
            setSelectedCoachStats({
                totalBookings: Math.floor(Math.random() * 50) + 10,
                monthlyBookings: Math.floor(Math.random() * 20) + 5,
                weeklyBookings: Math.floor(Math.random() * 10) + 2,
                upcomingBookings: Math.floor(Math.random() * 5) + 1,
                totalRevenue: Math.floor(Math.random() * 50000) + 10000,
                rating: 4.5,
                experience: 5,
                status: 'available'
            });
            setShowCoachStatsModal(true);
        }
    };

    const handleManageAvailability = (coach) => {
        setEditingCoach(coach);
        setCoachAvailability(coach.availability || []);
        setShowAvailabilityModal(true);
    };

    const handleSaveAvailability = async () => {
        try {
            await adminService.updateCoachAvailability(editingCoach._id, coachAvailability);
            alert('Coach availability updated successfully!');
            setShowAvailabilityModal(false);
            fetchDashboardData();
        } catch (error) {
            alert('Error updating availability: ' + (error.response?.data?.error || error.message));
        }
    };

    const addAvailabilitySlot = () => {
        setCoachAvailability([
            ...coachAvailability,
            { day: 'monday', startTime: '09:00', endTime: '17:00', isActive: true }
        ]);
    };

    const removeAvailabilitySlot = (index) => {
        const newAvailability = [...coachAvailability];
        newAvailability.splice(index, 1);
        setCoachAvailability(newAvailability);
    };

    const updateAvailabilitySlot = (index, field, value) => {
        const newAvailability = [...coachAvailability];
        newAvailability[index][field] = value;
        setCoachAvailability(newAvailability);
    };

    const handleCreateRule = async (e) => {
        e.preventDefault();
        try {
            await adminService.createPricingRule(newRule);
            alert('Pricing rule created successfully!');
            setNewRule({
                name: '',
                type: 'peak_hour',
                description: '',
                multiplier: 1.0,
                startTime: '',
                endTime: '',
                dayOfWeek: [],
                isActive: true
            });
            fetchDashboardData();
        } catch (error) {
            alert('Error creating pricing rule: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCreateEquipment = async (e) => {
        e.preventDefault();
        try {
            await adminService.createEquipment({
                ...newEquipment,
                availableStock: newEquipment.totalStock
            });
            alert('Equipment added successfully!');
            setNewEquipment({
                name: '',
                type: 'racket',
                totalStock: 0,
                rentalPrice: 0,
                description: ''
            });
            fetchDashboardData();
        } catch (error) {
            alert('Error adding equipment: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCreateCourt = async (e) => {
        e.preventDefault();
        try {
            await adminService.createCourt(newCourt);
            alert('Court added successfully!');
            setNewCourt({
                name: '',
                type: 'indoor',
                sportType: 'badminton',
                basePrice: 2000,
                description: '',
                amenities: []
            });
            fetchDashboardData();
        } catch (error) {
            alert('Error adding court: ' + (error.response?.data?.error || error.message));
        }
    };

    const toggleRuleStatus = async (ruleId, currentStatus) => {
        try {
            await adminService.updatePricingRule(ruleId, {
                isActive: !currentStatus
            });
            fetchDashboardData();
        } catch (error) {
            alert('Error updating rule status: ' + (error.response?.data?.error || error.message));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
            case 'available':
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
            case 'unavailable':
                return 'bg-red-100 text-red-800';
            case 'on_leave':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSportIcon = (sport) => {
        switch (sport.toLowerCase()) {
            case 'badminton':
                return <CourtIcon className="h-5 w-5" />;
            case 'tennis':
                return <TennisIcon className="h-5 w-5" />;
            case 'basketball':
                return <BasketballIcon className="h-5 w-5" />;
            case 'squash':
                return <SquashIcon className="h-5 w-5" />;
            default:
                return <CourtIcon className="h-5 w-5" />;
        }
    };

    const getEquipmentIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'racket':
                return '🎾';
            case 'shoes':
                return '👟';
            case 'ball':
                return '⚽';
            default:
                return '🏓';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your sports facility efficiently</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <PeopleIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">{stats.totalBookings}</h3>
                                <p className="text-gray-600">Total Bookings</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-green-100 p-3 rounded-full">
                                <MoneyIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {formatCurrency(stats.totalRevenue)}
                                </h3>
                                <p className="text-gray-600">Total Revenue</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <PeopleIcon className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">{stats.activeCoaches}</h3>
                                <p className="text-gray-600">Active Coaches</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <CourtIcon className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">{stats.availableCourts}</h3>
                                <p className="text-gray-600">Available Courts</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {['overview', 'coaches', 'pricing', 'equipment', 'courts', 'bookings', 'add'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab === 'add' ? 'Add New' : tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    {activeTab === 'overview' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview & Analytics</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                                <Legend />
                                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Distribution by Sport</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={bookingTypeData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {bookingTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="bg-blue-100 p-3 rounded-full">
                                            <PeopleIcon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold text-gray-900">{coaches.length}</h3>
                                            <p className="text-gray-600">Total Coaches</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-6 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="bg-green-100 p-3 rounded-full">
                                            <CourtIcon className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold text-gray-900">{courts.length}</h3>
                                            <p className="text-gray-600">Total Courts</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50 p-6 rounded-lg">
                                    <div className="flex items-center">
                                        <div className="bg-purple-100 p-3 rounded-full">
                                            <MoneyIcon className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {equipment.length}
                                            </h3>
                                            <p className="text-gray-600">Equipment Types</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Booking ID
                                                </th>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Court
                                                </th>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date & Time
                                                </th>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentBookings.length > 0 ? recentBookings.map((booking) => (
                                                <tr key={booking._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking._id.substring(0, 8)}...
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {booking.user?.name || 'User'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {booking.court?.name || 'Court'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {formatDate(booking.startTime)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {formatCurrency(booking.pricingBreakdown?.total || 0)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                        No recent bookings found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'coaches' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Coaches Management</h2>
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
                                >
                                    <AddIcon className="h-5 w-5 mr-2" />
                                    Add Coach
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{coaches.length}</div>
                                    <div className="text-sm text-blue-800">Total Coaches</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {coaches.filter(c => c.status === 'available').length}
                                    </div>
                                    <div className="text-sm text-green-800">Available</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">
                                        {coaches.filter(c => c.status === 'unavailable').length}
                                    </div>
                                    <div className="text-sm text-red-800">Unavailable</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {formatCurrency(coaches.reduce((sum, coach) => sum + (coach.hourlyRate || 0), 0))}
                                    </div>
                                    <div className="text-sm text-purple-800">Total Hourly Rate</div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Coach
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Specialization
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Rate & Experience
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {coaches.length > 0 ? coaches.map((coach) => (
                                            <tr key={coach._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                            <PeopleIcon className="h-6 w-6 text-primary-600" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{coach.name}</div>
                                                            <div className="text-sm text-gray-500">{coach.experience} years exp</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 flex items-center">
                                                        <EmailIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                        {coach.email}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center mt-1">
                                                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                        {coach.phone}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {coach.sportSpecialization && coach.sportSpecialization.map((sport) => (
                                                            <span key={sport} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                                                {sport}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-primary-600">
                                                        {formatCurrency(coach.hourlyRate)}/hour
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {coach.experience} years experience
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(coach.status)}`}>
                                                        {coach.status?.replace('_', ' ') || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleEditCoach(coach)}
                                                            className="text-blue-600 hover:text-blue-900 p-1"
                                                            title="Edit"
                                                        >
                                                            <EditIcon className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateCoachStatus(coach._id, coach.status)}
                                                            className={`p-1 ${coach.status === 'available'
                                                                ? 'text-red-600 hover:text-red-900'
                                                                : 'text-green-600 hover:text-green-900'
                                                                }`}
                                                            title={coach.status === 'available' ? 'Set Unavailable' : 'Set Available'}
                                                        >
                                                            {coach.status === 'available' ? <BlockIcon /> : <CheckCircleIcon />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateCoachRate(coach._id, coach.hourlyRate)}
                                                            className="text-purple-600 hover:text-purple-900 p-1"
                                                            title="Change Rate"
                                                        >
                                                            <MoneyIcon className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleManageAvailability(coach)}
                                                            className="text-amber-600 hover:text-amber-900 p-1"
                                                            title="Availability"
                                                        >
                                                            <ScheduleIcon className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleViewCoachStats(coach._id)}
                                                            className="text-gray-600 hover:text-gray-900 p-1"
                                                            title="View Stats"
                                                        >
                                                            <ViewIcon className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setCoachToDelete(coach._id);
                                                                setShowDeleteConfirm(true);
                                                            }}
                                                            className="text-red-600 hover:text-red-900 p-1"
                                                            title="Delete"
                                                        >
                                                            <DeleteIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                    No coaches found. Add your first coach!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'pricing' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Pricing Rules</h2>
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
                                >
                                    <AddIcon className="h-5 w-5 mr-2" />
                                    Add Rule
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Multiplier
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pricingRules.length > 0 ? pricingRules.map((rule) => (
                                            <tr key={rule._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 capitalize">
                                                        {rule.type?.replace('_', ' ') || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                                        {rule.description || 'No description'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">x{rule.multiplier}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {rule.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => toggleRuleStatus(rule._id, rule.isActive)}
                                                        className={`mr-3 ${rule.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                    >
                                                        {rule.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                                                        <EditIcon className="h-5 w-5" />
                                                    </button>
                                                    <button className="text-red-600 hover:text-red-900">
                                                        <DeleteIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                    No pricing rules found. Add your first rule!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'equipment' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Equipment Inventory</h2>
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
                                >
                                    <AddIcon className="h-5 w-5 mr-2" />
                                    Add Equipment
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {equipment.length > 0 ? equipment.map((item) => (
                                    <div key={item._id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-2">{getEquipmentIcon(item.type)}</span>
                                                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize mt-2">
                                                    {item.type}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-primary-600">
                                                    {formatCurrency(item.rentalPrice)}
                                                </div>
                                                <div className="text-sm text-gray-500">per rental</div>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 mb-4 text-sm">{item.description || 'No description'}</p>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-sm text-gray-500">Stock</div>
                                                <div className="text-lg font-semibold">
                                                    {item.availableStock} / {item.totalStock}
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${item.availableStock > 5 ? 'bg-green-100 text-green-800' :
                                                item.availableStock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {item.availableStock > 5 ? 'In Stock' :
                                                    item.availableStock > 0 ? 'Low Stock' : 'Out of Stock'}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-3 text-center py-12 text-gray-500">
                                        No equipment found. Add your first equipment item!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'courts' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Courts Management</h2>
                                <button
                                    onClick={() => setActiveTab('add')}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
                                >
                                    <AddIcon className="h-5 w-5 mr-2" />
                                    Add Court
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courts.length > 0 ? courts.map((court) => (
                                    <div key={court._id} className="bg-white border rounded-lg p-6 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{court.name}</h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${court.type === 'indoor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {court.type}
                                                    </span>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                                        {getSportIcon(court.sportType)}
                                                        <span className="ml-1">{court.sportType}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-primary-600">
                                                    {formatCurrency(court.basePrice)}
                                                </div>
                                                <div className="text-sm text-gray-500">per hour</div>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 mb-4 text-sm">{court.description || 'No description'}</p>

                                        {court.amenities && court.amenities.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-900 mb-2">Amenities</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {court.amenities.map((amenity, index) => (
                                                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                            {amenity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${court.status === 'active' ? 'bg-green-100 text-green-800' :
                                                court.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {court.status}
                                            </span>
                                            <div className="flex space-x-2">
                                                <button className="text-primary-600 hover:text-primary-800">
                                                    <EditIcon className="h-5 w-5" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-800">
                                                    <DeleteIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-3 text-center py-12 text-gray-500">
                                        No courts found. Add your first court!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'bookings' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">All Bookings</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Booking ID
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Court
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date & Time
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Duration
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentBookings.length > 0 ? recentBookings.map((booking) => (
                                            <tr key={booking._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {booking._id.substring(0, 8)}...
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {booking.user?.name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {booking.user?.email || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {booking.court?.name || 'Unknown Court'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {formatDate(booking.startTime)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {booking.duration || 1} hour{booking.duration > 1 ? 's' : ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatCurrency(booking.pricingBreakdown?.total || 0)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                    No bookings found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'add' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Items</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Coach</h3>
                                    <form onSubmit={handleCreateCoach}>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                                                    <input
                                                        type="text"
                                                        value={newCoach.name}
                                                        onChange={(e) => setNewCoach({ ...newCoach, name: e.target.value })}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                                                    <input
                                                        type="email"
                                                        value={newCoach.email}
                                                        onChange={(e) => setNewCoach({ ...newCoach, email: e.target.value })}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                                                <input
                                                    type="tel"
                                                    value={newCoach.phone}
                                                    onChange={(e) => setNewCoach({ ...newCoach, phone: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Sport Specialization *</label>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {['badminton', 'tennis', 'basketball', 'squash'].map((sport) => (
                                                        <label key={sport} className="inline-flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={newCoach.sportSpecialization.includes(sport)}
                                                                onChange={(e) => {
                                                                    const newSports = e.target.checked
                                                                        ? [...newCoach.sportSpecialization, sport]
                                                                        : newCoach.sportSpecialization.filter(s => s !== sport);
                                                                    setNewCoach({ ...newCoach, sportSpecialization: newSports });
                                                                }}
                                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700 capitalize">{sport}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Hourly Rate (₹) *</label>
                                                    <input
                                                        type="number"
                                                        value={newCoach.hourlyRate}
                                                        onChange={(e) => setNewCoach({ ...newCoach, hourlyRate: parseFloat(e.target.value) })}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        required
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Experience (years) *</label>
                                                    <input
                                                        type="number"
                                                        value={newCoach.experience}
                                                        onChange={(e) => setNewCoach({ ...newCoach, experience: parseInt(e.target.value) })}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        required
                                                        min="0"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    value={newCoach.description}
                                                    onChange={(e) => setNewCoach({ ...newCoach, description: e.target.value })}
                                                    rows="3"
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    placeholder="Coach's background, achievements, etc."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Initial Status</label>
                                                <select
                                                    value={newCoach.status}
                                                    onChange={(e) => setNewCoach({ ...newCoach, status: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                >
                                                    <option value="available">Available</option>
                                                    <option value="unavailable">Unavailable</option>
                                                    <option value="on_leave">On Leave</option>
                                                </select>
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                            >
                                                Add Coach
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Pricing Rule</h3>
                                    <form onSubmit={handleCreateRule}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Rule Name *</label>
                                                <input
                                                    type="text"
                                                    value={newRule.name}
                                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Rule Type *</label>
                                                <select
                                                    value={newRule.type}
                                                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                >
                                                    <option value="peak_hour">Peak Hour</option>
                                                    <option value="weekend">Weekend</option>
                                                    <option value="holiday">Holiday</option>
                                                    <option value="special_event">Special Event</option>
                                                    <option value="seasonal">Seasonal</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Multiplier *</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="1.0"
                                                    value={newRule.multiplier}
                                                    onChange={(e) => setNewRule({ ...newRule, multiplier: parseFloat(e.target.value) })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    value={newRule.description}
                                                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                                    rows="3"
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    placeholder="Description of the pricing rule..."
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                            >
                                                Create Pricing Rule
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Equipment</h3>
                                    <form onSubmit={handleCreateEquipment}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Equipment Name *</label>
                                                <input
                                                    type="text"
                                                    value={newEquipment.name}
                                                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Type *</label>
                                                <select
                                                    value={newEquipment.type}
                                                    onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                >
                                                    <option value="racket">Racket</option>
                                                    <option value="shoes">Shoes</option>
                                                    <option value="ball">Ball</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Total Stock *</label>
                                                    <input
                                                        type="number"
                                                        value={newEquipment.totalStock}
                                                        onChange={(e) => setNewEquipment({ ...newEquipment, totalStock: parseInt(e.target.value) })}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        required
                                                        min="0"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Rental Price (₹) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={newEquipment.rentalPrice}
                                                        onChange={(e) => setNewEquipment({ ...newEquipment, rentalPrice: parseFloat(e.target.value) })}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                        required
                                                        min="0"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    value={newEquipment.description}
                                                    onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                                                    rows="2"
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    placeholder="Description of the equipment..."
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                            >
                                                Add Equipment
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Court</h3>
                                    <form onSubmit={handleCreateCourt}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Court Name *</label>
                                                <input
                                                    type="text"
                                                    value={newCourt.name}
                                                    onChange={(e) => setNewCourt({ ...newCourt, name: e.target.value })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                                                    <select
                                                        value={newCourt.type}
                                                        onChange={(e) => setNewCourt({ ...newCourt, type: e.target.value })}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    >
                                                        <option value="indoor">Indoor</option>
                                                        <option value="outdoor">Outdoor</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Sport Type *</label>
                                                    <select
                                                        value={newCourt.sportType}
                                                        onChange={(e) => setNewCourt({ ...newCourt, sportType: e.target.value })}
                                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    >
                                                        <option value="badminton">Badminton</option>
                                                        <option value="tennis">Tennis</option>
                                                        <option value="basketball">Basketball</option>
                                                        <option value="squash">Squash</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Base Price (₹/hour) *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={newCourt.basePrice}
                                                    onChange={(e) => setNewCourt({ ...newCourt, basePrice: parseFloat(e.target.value) })}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    required
                                                    min="0"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    value={newCourt.description}
                                                    onChange={(e) => setNewCourt({ ...newCourt, description: e.target.value })}
                                                    rows="3"
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    placeholder="Description of the court..."
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                            >
                                                Add Court
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showEditCoachModal && editingCoach && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Edit Coach</h3>
                            <button
                                onClick={() => setShowEditCoachModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCoach}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                                    <input
                                        type="text"
                                        value={editingCoach.name || ''}
                                        onChange={(e) => setEditingCoach({ ...editingCoach, name: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                                    <input
                                        type="email"
                                        value={editingCoach.email || ''}
                                        onChange={(e) => setEditingCoach({ ...editingCoach, email: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Hourly Rate (₹) *</label>
                                        <input
                                            type="number"
                                            value={editingCoach.hourlyRate || 0}
                                            onChange={(e) => setEditingCoach({ ...editingCoach, hourlyRate: parseFloat(e.target.value) })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Experience (years) *</label>
                                        <input
                                            type="number"
                                            value={editingCoach.experience || 0}
                                            onChange={(e) => setEditingCoach({ ...editingCoach, experience: parseInt(e.target.value) })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={editingCoach.status || 'available'}
                                        onChange={(e) => setEditingCoach({ ...editingCoach, status: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="available">Available</option>
                                        <option value="unavailable">Unavailable</option>
                                        <option value="on_leave">On Leave</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={editingCoach.description || ''}
                                        onChange={(e) => setEditingCoach({ ...editingCoach, description: e.target.value })}
                                        rows="3"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditCoachModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        Update Coach
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAvailabilityModal && editingCoach && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">
                                Manage Availability for {editingCoach.name}
                            </h3>
                            <button
                                onClick={() => setShowAvailabilityModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-medium text-gray-900">Weekly Schedule</h4>
                                <button
                                    onClick={addAvailabilitySlot}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <AddIcon className="h-4 w-4 mr-2" />
                                    Add Time Slot
                                </button>
                            </div>

                            {coachAvailability.map((slot, index) => (
                                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-3">
                                    <select
                                        value={slot.day}
                                        onChange={(e) => updateAvailabilitySlot(index, 'day', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        {DAYS.map(day => (
                                            <option key={day} value={day}>
                                                {day.charAt(0).toUpperCase() + day.slice(1)}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => updateAvailabilitySlot(index, 'startTime', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />

                                    <span className="text-gray-500">to</span>

                                    <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => updateAvailabilitySlot(index, 'endTime', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={slot.isActive !== false}
                                            onChange={(e) => updateAvailabilitySlot(index, 'isActive', e.target.checked)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                    </label>

                                    <button
                                        onClick={() => removeAvailabilitySlot(index)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                    >
                                        <DeleteIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}

                            {coachAvailability.length === 0 && (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    <ScheduleIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2">No availability slots configured.</p>
                                    <p className="text-sm">Add slots to specify when this coach is available.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowAvailabilityModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAvailability}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Save Availability
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCoachStatsModal && selectedCoachStats && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Coach Statistics</h3>
                            <button
                                onClick={() => setShowCoachStatsModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{selectedCoachStats.totalBookings}</div>
                                    <div className="text-sm text-blue-800">Total Bookings</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{selectedCoachStats.monthlyBookings}</div>
                                    <div className="text-sm text-green-800">This Month</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{selectedCoachStats.weeklyBookings}</div>
                                    <div className="text-sm text-purple-800">This Week</div>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-amber-600">{selectedCoachStats.upcomingBookings}</div>
                                    <div className="text-sm text-amber-800">Upcoming</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-gray-600">
                                    {formatCurrency(selectedCoachStats.totalRevenue)}
                                </div>
                                <div className="text-sm text-gray-800">Total Revenue Generated</div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                <div>
                                    <div className="text-sm text-gray-500">Rating</div>
                                    <div className="flex items-center">
                                        <StarIcon className="h-5 w-5 text-yellow-500" />
                                        <span className="ml-2 font-semibold">{selectedCoachStats.rating || 'N/A'}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Status</div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCoachStats.status)}`}>
                                        {selectedCoachStats.status?.replace('_', ' ') || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowCoachStatsModal(false)}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <div className="text-center">
                            <DeleteIcon className="mx-auto h-12 w-12 text-red-500" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Delete Coach</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Are you sure you want to delete this coach? This action cannot be undone.
                            </p>
                        </div>

                        <div className="mt-6 flex justify-center space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteCoach}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;