'use client'

import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const AdminDashboard = () => {
    const [timeRange, setTimeRange] = useState('week');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        revenue: { current: 0, previous: 0, change: 0 },
        orders: { current: 0, previous: 0, change: 0 },
        products: { current: 0, active: 0, inactive: 0 },
        customers: { current: 0, new: 0, change: 0 }
    });
    const [revenueData, setRevenueData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchStats(),
                fetchRevenueData(),
                fetchCategoryData(),
                fetchTopProducts(),
                fetchRecentOrders()
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const now = new Date();
        const startOfPeriod = getStartDate(timeRange);
        const previousPeriodStart = getPreviousPeriodStart(timeRange);

        // Fetch total revenue for current period
        const { data: currentOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .gte('created_at', startOfPeriod.toISOString())
            .neq('status', 'cancelled');

        const currentRevenue = currentOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

        // Fetch previous period revenue
        const { data: previousOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .gte('created_at', previousPeriodStart.toISOString())
            .lt('created_at', startOfPeriod.toISOString())
            .neq('status', 'cancelled');

        const previousRevenue = previousOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

        // Fetch products count
        const { count: totalProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        const { count: activeProducts } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // Fetch customers count
        const { count: totalCustomers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { count: newCustomers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfPeriod.toISOString());

        setStats({
            revenue: {
                current: currentRevenue,
                previous: previousRevenue,
                change: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
            },
            orders: {
                current: currentOrders?.length || 0,
                previous: previousOrders?.length || 0,
                change: previousOrders?.length > 0 ? ((currentOrders?.length - previousOrders?.length) / previousOrders?.length) * 100 : 0
            },
            products: {
                current: totalProducts || 0,
                active: activeProducts || 0,
                inactive: (totalProducts || 0) - (activeProducts || 0)
            },
            customers: {
                current: totalCustomers || 0,
                new: newCustomers || 0,
                change: 0
            }
        });
    };

    const fetchRevenueData = async () => {
        const startDate = getStartDate(timeRange);
        const { data: orders } = await supabase
            .from('orders')
            .select('created_at, total_amount')
            .gte('created_at', startDate.toISOString())
            .neq('status', 'cancelled')
            .order('created_at', { ascending: true });

        if (!orders) return;

        const groupedData = orders.reduce((acc, order) => {
            const date = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short' });
            if (!acc[date]) {
                acc[date] = { date, revenue: 0, orders: 0 };
            }
            acc[date].revenue += parseFloat(order.total_amount);
            acc[date].orders += 1;
            return acc;
        }, {});

        setRevenueData(Object.values(groupedData));
    };

    const fetchCategoryData = async () => {
        const { data: categories } = await supabase
            .from('product_categories')
            .select('name')
            .eq('is_active', true);

        if (!categories) return;

        const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
        const categoryStats = await Promise.all(
            categories.map(async (cat, idx) => {
                const { count } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('category', cat.name)
                    .eq('is_active', true);

                return {
                    name: cat.name,
                    value: count || 0,
                    color: colors[idx % colors.length]
                };
            })
        );

        setCategoryData(categoryStats.filter(c => c.value > 0));
    };

    const fetchTopProducts = async () => {
        const { data: orderItems } = await supabase
            .from('order_items')
            .select('product_id, product_name, quantity, subtotal');

        if (!orderItems) return;

        const productStats = orderItems.reduce((acc, item) => {
            if (!acc[item.product_id]) {
                acc[item.product_id] = {
                    name: item.product_name,
                    sold: 0,
                    revenue: 0
                };
            }
            acc[item.product_id].sold += item.quantity;
            acc[item.product_id].revenue += parseFloat(item.subtotal);
            return acc;
        }, {});

        const sorted = Object.values(productStats)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5);

        setTopProducts(sorted);
    };

    const fetchRecentOrders = async () => {
        const { data: orders } = await supabase
            .from('orders')
            .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        profiles:user_id (full_name),
        guest_customers:guest_customer_id (full_name)
      `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (!orders) return;

        const formatted = orders.map(order => ({
            id: order.order_number,
            customer: order.profiles?.full_name || order.guest_customers?.full_name || 'Guest',
            amount: parseFloat(order.total_amount),
            status: order.status,
            time: getTimeAgo(order.created_at)
        }));

        setRecentOrders(formatted);
    };

    const getStartDate = (range) => {
        const now = new Date();
        switch (range) {
            case 'today':
                return new Date(now.setHours(0, 0, 0, 0));
            case 'week':
                return new Date(now.setDate(now.getDate() - 7));
            case 'month':
                return new Date(now.setMonth(now.getMonth() - 1));
            case 'year':
                return new Date(now.setFullYear(now.getFullYear() - 1));
            default:
                return new Date(now.setDate(now.getDate() - 7));
        }
    };

    const getPreviousPeriodStart = (range) => {
        const now = new Date();
        switch (range) {
            case 'today':
                return new Date(now.setDate(now.getDate() - 1));
            case 'week':
                return new Date(now.setDate(now.getDate() - 14));
            case 'month':
                return new Date(now.setMonth(now.getMonth() - 2));
            case 'year':
                return new Date(now.setFullYear(now.getFullYear() - 2));
            default:
                return new Date(now.setDate(now.getDate() - 14));
        }
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const getStatusColor = (status) => {
        const colors = {
            delivered: 'bg-green-100 text-green-800',
            processing: 'bg-blue-100 text-blue-800',
            pending: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
            out_for_delivery: 'bg-purple-100 text-purple-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        const icons = {
            delivered: <CheckCircle className="w-4 h-4" />,
            processing: <Clock className="w-4 h-4" />,
            pending: <AlertCircle className="w-4 h-4" />,
            cancelled: <XCircle className="w-4 h-4" />
        };
        return icons[status];
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                PKR {stats.revenue.current.toLocaleString()}
                            </h3>
                            <div className="flex items-center mt-2">
                                {stats.revenue.change >= 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span className={`text-sm font-medium ml-1 ${stats.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenue.change >= 0 ? '+' : ''}{stats.revenue.change.toFixed(1)}%
                </span>
                                <span className="text-xs text-gray-500 ml-2">vs last period</span>
                            </div>
                        </div>
                        {/*<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">*/}
                        {/*    /!*<FaRupeeSign  className="w-6 h-6 text-green-600" />*!/*/}
                        {/*</div>*/}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {stats.orders.current}
                            </h3>
                            <div className="flex items-center mt-2">
                                {stats.orders.change >= 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span className={`text-sm font-medium ml-1 ${stats.orders.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.orders.change >= 0 ? '+' : ''}{stats.orders.change.toFixed(1)}%
                </span>
                                <span className="text-xs text-gray-500 ml-2">vs last period</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">Total Products</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {stats.products.current}
                            </h3>
                            <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600 font-medium">
                  {stats.products.active} active
                </span>
                                <span className="text-xs text-gray-500 ml-2">• {stats.products.inactive} inactive</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">Total Customers</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {stats.customers.current}
                            </h3>
                            <div className="flex items-center mt-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium ml-1">
                  +{stats.customers.new} new
                </span>
                                <span className="text-xs text-gray-500 ml-2">this period</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Orders Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-0 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={80}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <span className="text-sm font-semibold text-green-600">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.sold} units sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">PKR {product.revenue.toFixed(0)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentOrders.map((order, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <p className="font-medium text-gray-900">{order.id}</p>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                                                {order.status}
                      </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{order.customer} • {order.time}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">PKR {order.amount}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;