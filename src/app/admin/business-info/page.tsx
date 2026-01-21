// src/app/admin/business-info/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, MapPin, Phone, Award, Clock, Plus, Edit, Trash2 } from 'lucide-react'

interface BusinessInfo {
    id: string
    physical_address: string
    phone_number: string
    certification_name: string
    certification_number: string
    working_hours: string
}

interface Category {
    id: string
    name: string
    slug: string
    description: string | null
    icon_name: string | null
    display_order: number
    is_active: boolean
}

export default function AdminBusinessInfoPage() {
    const [info, setInfo] = useState<BusinessInfo | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'info' | 'categories'>('info')
    const [showAddCategory, setShowAddCategory] = useState(false)
    const [newCategory, setNewCategory] = useState({ name: '', description: '' })

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)

        // Fetch business info
        const { data: infoData } = await supabase
            .from('business_info')
            .select('*')
            .eq('is_active', true)
            .single()

        if (infoData) {
            setInfo(infoData as BusinessInfo)
        }

        // Fetch categories
        const { data: categoriesData } = await supabase
            .from('product_categories')
            .select('*')
            .order('display_order')

        if (categoriesData) {
            setCategories(categoriesData as Category[])
        }

        setIsLoading(false)
    }

    const handleSaveBusinessInfo = async () => {
        if (!info) return

        setIsSaving(true)

        try {
            const { error } = await supabase
                .from('business_info')
                .upsert({
                    id: info.id,
                    physical_address: info.physical_address,
                    phone_number: info.phone_number,
                    certification_name: info.certification_name,
                    certification_number: info.certification_number,
                    working_hours: info.working_hours,
                    is_active: true
                })

            if (error) throw error

            alert('Business information updated successfully!')
        } catch (error: any) {
            alert('Failed to update: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddCategory = async () => {
        if (!newCategory.name) {
            alert('Category name is required')
            return
        }

        try {
            const slug = newCategory.name.toLowerCase().replace(/\s+/g, '-')

            const { error } = await supabase
                .from('product_categories')
                .insert({
                    name: newCategory.name,
                    slug: slug,
                    description: newCategory.description || null,
                    display_order: categories.length + 1,
                    is_active: true
                })

            if (error) throw error

            alert('Category added successfully!')
            setShowAddCategory(false)
            setNewCategory({ name: '', description: '' })
            fetchData()
        } catch (error: any) {
            alert('Failed to add category: ' + error.message)
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm('Are you sure? Products in this category will need reassignment.')) {
            return
        }

        try {
            const { error } = await supabase
                .from('product_categories')
                .delete()
                .eq('id', categoryId)

            if (error) throw error

            alert('Category deleted successfully!')
            fetchData()
        } catch (error: any) {
            alert('Failed to delete: ' + error.message)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Business Settings</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-3 font-medium transition-colors ${
                        activeTab === 'info'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Business Info
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-3 font-medium transition-colors ${
                        activeTab === 'categories'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Product Categories
                </button>
            </div>

            {/* Business Info Tab */}
            {activeTab === 'info' && info && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Business Information</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        This information will be displayed in the top bar of your website
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4" />
                                Physical Address
                            </label>
                            <input
                                type="text"
                                value={info.physical_address}
                                onChange={(e) => setInfo({ ...info, physical_address: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="Shop 123, Main Street, City"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={info.phone_number}
                                onChange={(e) => setInfo({ ...info, phone_number: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="+92 300 1234567"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Award className="w-4 h-4" />
                                    Certification Name
                                </label>
                                <input
                                    type="text"
                                    value={info.certification_name}
                                    onChange={(e) => setInfo({ ...info, certification_name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="PSQCA Food Safety"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Certification Number
                                </label>
                                <input
                                    type="text"
                                    value={info.certification_number}
                                    onChange={(e) => setInfo({ ...info, certification_number: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="FS-2024-FSD-0123"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4" />
                                Working Hours
                            </label>
                            <input
                                type="text"
                                value={info.working_hours}
                                onChange={(e) => setInfo({ ...info, working_hours: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="Mon-Sun: 7AM - 9PM"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSaveBusinessInfo}
                        disabled={isSaving}
                        className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            'Saving...'
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Business Information
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-gray-900">Product Categories</h2>
                        <button
                            onClick={() => setShowAddCategory(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Category
                        </button>
                    </div>

                    {/* Add Category Modal */}
                    {showAddCategory && (
                        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">New Category</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="e.g., Fruits"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="e.g., Fresh seasonal fruits"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAddCategory}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                                    >
                                        Add Category
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAddCategory(false)
                                            setNewCategory({ name: '', description: '' })
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Categories List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="divide-y">
                            {categories.map((category) => (
                                <div key={category.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                                        <p className="text-sm text-gray-600">{category.description || 'No description'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Slug: {category.slug}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-red-600 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}