// src/app/admin/products/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    MoreVertical,
    Eye,
    EyeOff,
    Package,
    DollarSign,
    X,
    Save,
    Upload
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Product Modal Component
const ProductModal = ({ isOpen, onClose, product, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category_id: '',
        image_url: '',
        base_unit: 'kg',
        pricing_type: 'daily',
        is_active: true,
        price_per_kg: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (product) {
                loadProductData();
            } else {
                resetForm();
            }
        }
    }, [isOpen, product]);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('product_categories')
            .select('id, name')
            .eq('is_active', true)
            .order('display_order');

        if (data) setCategories(data);
    };

    const loadProductData = async () => {
        const { data: priceData } = await supabase
            .from('daily_prices')
            .select('price_per_kg')
            .eq('product_id', product.id)
            .order('effective_date', { ascending: false })
            .limit(1)
            .single();

        setFormData({
            name: product.name || '',
            description: product.description || '',
            category_id: product.category_id || '',
            image_url: product.image_url || '',
            base_unit: product.base_unit || 'kg',
            pricing_type: product.pricing_type || 'daily',
            is_active: product.is_active ?? true,
            price_per_kg: priceData?.price_per_kg || ''
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category_id: '',
            image_url: '',
            base_unit: 'kg',
            pricing_type: 'daily',
            is_active: true,
            price_per_kg: ''
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.category_id || !formData.price_per_kg) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            let productId = product?.id;

            if (product) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        category_id: formData.category_id,
                        image_url: formData.image_url,
                        base_unit: formData.base_unit,
                        pricing_type: formData.pricing_type,
                        is_active: formData.is_active
                    })
                    .eq('id', product.id);

                if (updateError) throw updateError;
            } else {
                const { data: newProduct, error: insertError } = await supabase
                    .from('products')
                    .insert({
                        name: formData.name,
                        description: formData.description,
                        category_id: formData.category_id,
                        image_url: formData.image_url,
                        base_unit: formData.base_unit,
                        pricing_type: formData.pricing_type,
                        is_active: formData.is_active
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                productId = newProduct.id;
            }

            const { error: priceError } = await supabase
                .from('daily_prices')
                .insert({
                    product_id: productId,
                    price_per_kg: parseFloat(formData.price_per_kg),
                    effective_date: new Date().toISOString().split('T')[0]
                });

            if (priceError) throw priceError;

            alert(product ? 'Product updated successfully!' : 'Product created successfully!');
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Fresh Tomatoes"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select a category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            placeholder="Describe your product..."
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            {/*<DollarSign className="w-4 h-4" />*/}
                            Price per KG <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="price_per_kg"
                            value={formData.price_per_kg}
                            onChange={handleChange}
                            step="0.01"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Base Unit</label>
                            <select
                                name="base_unit"
                                value={formData.base_unit}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="kg">Kilogram (kg)</option>
                                {/*<option value="g">Gram (g)</option>*/}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</label>
                            <select
                                name="pricing_type"
                                value={formData.pricing_type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="daily">Daily Price</option>
                                <option value="fixed">Fixed Price</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Upload className="w-4 h-4" />
                            Image URL
                        </label>
                        <input
                            type="url"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900">Product Status</p>
                            <p className="text-sm text-gray-500">
                                {formData.is_active ? 'Visible to customers' : 'Hidden'}
                            </p>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <span className="text-sm font-medium text-gray-700">Active</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-gray-300 rounded-full peer peer-checked:bg-green-600"></div>
                                <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                {product ? 'Update' : 'Create'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Products Component
const ProductsManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchProducts(), fetchCategories()]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                description,
                image_url,
                category,
                is_active,
                pricing_type,
                base_unit,
                category_id,
                product_categories!products_category_id_fkey (name),
                daily_prices (price_per_kg, effective_date)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
            return;
        }

        const formattedProducts = data.map(product => {
            const latestPrice = product.daily_prices
                ?.sort((a, b) => new Date(b.effective_date) - new Date(a.effective_date))[0];

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                category: product.product_categories?.name || product.category || 'Uncategorized',
                category_id: product.category_id,
                price: latestPrice?.price_per_kg || 0,
                unit: product.base_unit,
                status: product.is_active ? 'active' : 'inactive',
                is_active: product.is_active,
                image: product.image_url,
                image_url: product.image_url,
                base_unit: product.base_unit,
                pricing_type: product.pricing_type
            };
        });

        setProducts(formattedProducts);
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('product_categories')
            .select('name')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
            return;
        }

        setCategories(['All', ...(data?.map(c => c.name) || [])]);
    };

    const handleToggleStatus = async (productId, currentStatus) => {
        const { error } = await supabase
            .from('products')
            .update({ is_active: !currentStatus })
            .eq('id', productId);

        if (!error) fetchProducts();
    };

    const handleDelete = async (productId) => {
        if (confirm('Are you sure you want to delete this product?')) {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (!error) fetchProducts();
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setShowModal(true);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    const activeCount = products.filter(p => p.status === 'active').length;
    const inactiveCount = products.filter(p => p.status === 'inactive').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your product inventory</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Product</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white min-w-[150px]"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="text-xl font-bold text-gray-900">{products.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Eye className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-xl font-bold text-gray-900">{activeCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <EyeOff className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Inactive</p>
                            <p className="text-xl font-bold text-gray-900">{inactiveCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Categories</p>
                            <p className="text-xl font-bold text-gray-900">{categories.length - 1}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{product.name}</p>
                                        <p className="text-sm text-gray-500">{product.description?.substring(0, 30)}...</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm text-gray-700">{product.category}</span>
                            </td>
                            <td className="px-6 py-4">
                                <p className="font-semibold text-gray-900">PKR {product.price}</p>
                                <p className="text-sm text-gray-500">per {product.unit}</p>
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => handleToggleStatus(product.id, product.status === 'active')}
                                    className={`px-3 py-1 rounded-full text-xs font-medium Rs.{
                                        product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {product.status === 'active' ? 'Active' : 'Inactive'}
                                </button>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <Edit2 className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="lg:hidden space-y-4">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Package className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{product.category}</p>
                                <div className="flex items-center gap-2 mt-3">
                                    <span
                                        onClick={() => handleToggleStatus(product.id, product.status === 'active')}
                                        className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer Rs.{
                                            product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {product.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">PKR {product.price}</p>
                                        <p className="text-xs text-gray-500">per {product.unit}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ProductModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedProduct(null);
                }}
                product={selectedProduct}
                onSave={fetchData}
            />
        </div>
    );
};

export default ProductsManagement;