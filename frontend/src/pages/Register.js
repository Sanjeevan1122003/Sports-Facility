import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { PiEyeClosedFill, PiEyeFill } from "react-icons/pi";
import {
    PiCheckCircleFill,
    PiXCircleFill,
    PiCaretDown,
    PiGlobe
} from "react-icons/pi";

const countryCodes = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' }
];

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        countryCode: '+91',
        role: 'user'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [filteredCountries, setFilteredCountries] = useState(countryCodes);
    const [countrySearch, setCountrySearch] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumbers: false,
        hasSpecialChar: false
    });
    const [showStrength, setShowStrength] = useState(false);
    const navigate = useNavigate();

    const passwordRules = useMemo(() => [
    {
        key: 'hasMinLength',
        label: 'At least 8 characters',
        test: (pwd) => pwd.length >= 8
    },
    {
        key: 'hasUpperCase',
        label: 'At least one uppercase letter (A-Z)',
        test: (pwd) => /[A-Z]/.test(pwd)
    },
    {
        key: 'hasLowerCase',
        label: 'At least one lowercase letter (a-z)',
        test: (pwd) => /[a-z]/.test(pwd)
    },
    {
        key: 'hasNumbers',
        label: 'At least one number (0-9)',
        test: (pwd) => /[0-9]/.test(pwd)
    },
    {
        key: 'hasSpecialChar',
        label: 'At least one special character (!@#$%^&*)',
        test: (pwd) => /[!@#$%^&*()_+={};':"\\|,.<>?]/.test(pwd)
    }
], []);

    useEffect(() => {
        if (countrySearch) {
            const filtered = countryCodes.filter(country =>
                country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
                country.code.includes(countrySearch)
            );
            setFilteredCountries(filtered);
        } else {
            setFilteredCountries(countryCodes);
        }
    }, [countrySearch]);

    const getSelectedCountry = () => {
        return countryCodes.find(country => country.code === formData.countryCode) || countryCodes[0];
    };

    const handlePhoneNumberChange = (e) => {
        const value = e.target.value.replace(/[^\d]/g, '');
        setPhoneNumber(value);

        const fullPhone = formData.countryCode + value;
        setFormData(prev => ({
            ...prev,
            phone: fullPhone
        }));
    };

    const handleCountryCodeChange = (code) => {
        setFormData(prev => ({
            ...prev,
            countryCode: code,
            phone: code + phoneNumber
        }));
        setShowCountryDropdown(false);
        setCountrySearch('');
    };

    useEffect(() => {
        const handleClickOutside = () => {
            setShowCountryDropdown(false);
        };

        if (showCountryDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [showCountryDropdown]);

    const calculateStrengthScore = () => {
        const checks = Object.values(passwordStrength);
        const passedChecks = checks.filter(Boolean).length;
        const totalChecks = checks.length;
        return Math.round((passedChecks / totalChecks) * 100);
    };

    const getStrengthInfo = () => {
        const score = calculateStrengthScore();
        if (score < 40) return { level: 'Weak', color: 'text-red-600', bgColor: 'bg-red-100', barColor: 'bg-red-500' };
        if (score < 70) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100', barColor: 'bg-yellow-500' };
        if (score < 90) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', barColor: 'bg-blue-500' };
        return { level: 'Strong', color: 'text-green-600', bgColor: 'bg-green-100', barColor: 'bg-green-500' };
    };

    useEffect(() => {
        const checkPasswordStrength = (password) => {
            const strength = {};
            passwordRules.forEach(rule => {
                strength[rule.key] = rule.test(password);
            });
            return strength;
        };
        if (formData.password) {
            const strength = checkPasswordStrength(formData.password);
            setPasswordStrength(strength);
            setShowStrength(true);
        } else {
            setShowStrength(false);
        }
    }, [formData.password, passwordRules]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (name === 'password') {
            setError('');
        }
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Full name is required');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        if (!phoneNumber.trim()) {
            setError('Phone number is required');
            return false;
        }

        const phoneDigits = phoneNumber.replace(/\D/g, '');
        if (phoneDigits.length < 6) {
            setError('Phone number must be at least 6 digits');
            return false;
        }

        if (phoneDigits.length > 15) {
            setError('Phone number is too long');
            return false;
        }

        const failedRules = passwordRules.filter(rule => !rule.test(formData.password));
        if (failedRules.length > 0) {
            const errors = failedRules.map(rule => rule.label.toLowerCase());
            const lastError = errors.pop();
            const errorMessage = errors.length > 0
                ? `Password must contain ${errors.join(', ')} and ${lastError}`
                : `Password must contain ${lastError}`;
            setError(errorMessage);
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await authService.register(formData);
            await authService.login({ email: formData.email, password: formData.password });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleCountryDropdown = (e) => {
        e.stopPropagation();
        setShowCountryDropdown(!showCountryDropdown);
    };

    const strengthInfo = getStrengthInfo();
    const strengthScore = calculateStrengthScore();
    const selectedCountry = getSelectedCountry();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                        sign in to existing account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                                <PiXCircleFill className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"

                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <div className="relative flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={toggleCountryDropdown}
                                        className="inline-flex items-center h-full px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:z-10"
                                    >
                                        <span className="mr-2 text-sm">{selectedCountry.flag}</span>
                                        <span className="text-sm font-medium">{selectedCountry.code}</span>
                                        <PiCaretDown className="ml-1 h-4 w-4 text-gray-400" />
                                    </button>
                                    {showCountryDropdown && (
                                        <div className="absolute z-10 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                                            onClick={(e) => e.stopPropagation()}>
                                            <div className="p-2 border-b">
                                                <div className="relative">
                                                    <PiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search country..."
                                                        value={countrySearch}
                                                        onChange={(e) => setCountrySearch(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="py-1">
                                                {filteredCountries.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        type="button"
                                                        onClick={() => handleCountryCodeChange(country.code)}
                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${formData.countryCode === country.code ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                                                            }`}
                                                    >
                                                        <span className="mr-3 text-base">{country.flag}</span>
                                                        <span className="flex-1">{country.country}</span>
                                                        <span className="text-gray-600 font-medium">{country.code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={handlePhoneNumberChange}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Enter phone number without country code. Only numbers allowed.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                            </div>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <PiEyeFill className="h-5 w-5 font-medium text-primary-600" />
                                    ) : (
                                        <PiEyeClosedFill className="h-5 w-5 font-medium text-primary-600" />
                                    )}
                                </button>
                            </div>
                            {showStrength && (
                                <div className="mt-4 space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">
                                                Password strength: <span className={strengthInfo.color}>{strengthInfo.level}</span>
                                            </span>
                                            <span className="text-xs text-gray-500">{strengthScore}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${strengthInfo.barColor} transition-all duration-300 ease-out`}
                                                style={{ width: `${strengthScore}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Password must contain:</p>
                                        <ul className="space-y-1">
                                            {passwordRules.map((rule) => (
                                                <li key={rule.key} className="flex items-center text-sm">
                                                    {passwordStrength[rule.key] ? (
                                                        <PiCheckCircleFill className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    ) : (
                                                        <PiXCircleFill className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                                                    )}
                                                    <span className={passwordStrength[rule.key] ? 'text-green-600' : 'text-gray-500'}>
                                                        {rule.label}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Account Type
                            </label>
                            <div className="mt-1 mb-1">
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="user">Regular User</option>
                                    <option value="admin">Administrator</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Note: Administrator accounts require additional verification
                                </p>
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={loading || (showStrength && strengthScore < 70)}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating account...
                                    </>
                                ) : 'Create account'}
                            </button>
                            {showStrength && strengthScore < 70 && (
                                <p className="mt-2 text-xs text-yellow-600 text-center">
                                    Password strength should be at least "Good" for better security
                                </p>
                            )}
                        </div>
                    </form>
                    <div className="mt-6">
                        <p className="text-xs text-center text-gray-500">
                            By creating an account, you agree to our{' '}
                            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
