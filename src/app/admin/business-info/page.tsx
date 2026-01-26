// src/app/admin/business-info/page.tsx
'use client'
import React, { useState, useEffect } from 'react';
import {
    Building2,
    Phone,
    MapPin,
    Award,
    Clock,
    Save,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BusinessSettings = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: null,
        physicalAddress: '',
        phoneNumber: '',
        certificationName: '',
        certificationNumber: '',
        workingHours: '',
        isActive: true
    });

    useEffect(() => {
        fetchBusinessInfo();
    }, []);

    const fetchBusinessInfo = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('business_info')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching business info:', error);
                return;
            }

            if (data) {
                setFormData({
                    id: data.id,
                    physicalAddress: data.physical_address,
                    phoneNumber: data.phone_number,
                    certificationName: data.certification_name,
                    certificationNumber: data.certification_number,
                    workingHours: data.working_hours,
                    isActive: data.is_active
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const dataToSave = {
                physical_address: formData.physicalAddress,
                phone_number: formData.phoneNumber,
                certification_name: formData.certificationName,
                certification_number: formData.certificationNumber,
                working_hours: formData.workingHours,
                is_active: formData.isActive
            };

            if (formData.id) {
                // Update existing record
                const { error } = await supabase
                    .from('business_info')
                    .update(dataToSave)
                    .eq('id', formData.id);

                if (error) throw error;
            } else {
                // Insert new record
                const { data, error } = await supabase
                    .from('business_info')
                    .insert(dataToSave)
                    .select()
                    .single();

                if (error) throw error;

                setFormData(prev => ({ ...prev, id: data.id }));
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving business info:', error);
            alert('Failed to save business information');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Business Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your business information and settings</p>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Settings saved successfully!</span>
                    </div>
                )}
            </div>

            {/* Status Card */}
            <div className={`rounded-xl p-6 border-2 ${
                formData.isActive
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
            }`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            formData.isActive ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                            <Building2 className={`w-6 h-6 ${
                                formData.isActive ? 'text-green-600' : 'text-red-600'
                            }`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Business Status</h3>
                            <p className={`text-sm ${
                                formData.isActive ? 'text-green-700' : 'text-red-700'
                            }`}>
                                Your business is currently {formData.isActive ? 'active' : 'inactive'}
                            </p>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-medium text-gray-700">Active</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-green-600 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                </div>
            </div>

            {/* Main Settings */}
            <div className="space-y-6">
                {/* Business Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                        <p className="text-sm text-gray-500 mt-1">Basic information about your business</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Physical Address */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                Physical Address
                            </label>
                            <textarea
                                name="physicalAddress"
                                value={formData.physicalAddress}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                placeholder="Enter your business address"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This address will be shown to customers
                            </p>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="+92 300 1234567"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Customer support contact number
                            </p>
                        </div>

                        {/* Working Hours */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                Working Hours
                            </label>
                            <input
                                type="text"
                                name="workingHours"
                                value={formData.workingHours}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., 8:00 AM - 8:00 PM"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Your business operating hours
                            </p>
                        </div>
                    </div>
                </div>

                {/* Certification Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900">Certification Details</h2>
                        <p className="text-sm text-gray-500 mt-1">Your business certification information</p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-blue-800 font-medium">Important Information</p>
                                <p className="text-sm text-blue-700 mt-1">
                                    Valid certification details build trust with your customers and ensure compliance with local regulations.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Certification Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Award className="w-4 h-4 text-gray-400" />
                                    Certification Name
                                </label>
                                <input
                                    type="text"
                                    name="certificationName"
                                    value={formData.certificationName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., Organic Certification"
                                />
                            </div>

                            {/* Certification Number */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Award className="w-4 h-4 text-gray-400" />
                                    Certification Number
                                </label>
                                <input
                                    type="text"
                                    name="certificationNumber"
                                    value={formData.certificationNumber}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., ORG-2024-001"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <button
                        type="button"
                        onClick={() => fetchBusinessInfo()}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Additional Settings Card */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-100 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Business Profile Summary</h3>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-600 font-medium">LOCATION</p>
                                <p className="text-sm text-gray-900 mt-1">{formData.physicalAddress || 'Not set'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">CONTACT</p>
                                <p className="text-sm text-gray-900 mt-1">{formData.phoneNumber || 'Not set'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">HOURS</p>
                                <p className="text-sm text-gray-900 mt-1">{formData.workingHours || 'Not set'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 font-medium">CERTIFICATION</p>
                                <p className="text-sm text-gray-900 mt-1">
                                    {formData.certificationName && formData.certificationNumber
                                        ? `${formData.certificationName} (${formData.certificationNumber})`
                                        : 'Not set'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessSettings;