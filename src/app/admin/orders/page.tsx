// src/app/admin/orders/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import {
    Search,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Package,
    Truck,
    Calendar,
    MapPin,
    Phone,
    Mail,
    Bike,
    User,
    Star
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const OrdersManagement = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [orderDetails, setOrderDetails] = useState(null);
    const [riders, setRiders] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);

    useEffect(() => {
        fetchOrders();
        fetchRiders();
    }, [statusFilter]);

    const fetchRiders = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .eq('role', 'rider');

        setRiders(data || []);
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('orders')
                .select(`
                    id,
                    order_number,
                    total_amount,
                    status,
                    payment_status,
                    payment_method,
                    delivery_address,
                    pin_code,
                    phone,
                    email,
                    notes,
                    created_at,
                    rider_id,
                    rider_assigned_at,
                    rider_delivered_at,
                    customer_rating,
                    customer_feedback,
                    profiles:user_id (full_name, phone),
                    guest_customers:guest_customer_id (full_name, phone, email),
                    delivery_slots:delivery_slot_id (slot_date, start_time, end_time),
                    order_items (quantity),
                    rider:rider_id (full_name, phone)
                `)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching orders:', error);
                return;
            }

            const formattedOrders = data.map(order => ({
                id: order.id,
                orderNumber: order.order_number,
                customer: {
                    name: order.profiles?.full_name || order.guest_customers?.full_name || 'Guest',
                    phone: order.phone || order.profiles?.phone || order.guest_customers?.phone,
                    email: order.email || order.guest_customers?.email || ''
                },
                rider: order.rider,
                riderId: order.rider_id,
                riderAssignedAt: order.rider_assigned_at,
                riderDeliveredAt: order.rider_delivered_at,
                customerRating: order.customer_rating,
                customerFeedback: order.customer_feedback,
                items: order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
                total: parseFloat(order.total_amount),
                status: order.status,
                paymentStatus: order.payment_status,
                paymentMethod: order.payment_method,
                deliveryDate: order.delivery_slots?.slot_date,
                deliveryTime: order.delivery_slots
                    ? `${order.delivery_slots.start_time} - ${order.delivery_slots.end_time}`
                    : 'Not scheduled',
                address: order.delivery_address,
                pinCode: order.pin_code,
                orderDate: new Date(order.created_at).toLocaleString(),
                notes: order.notes
            }));

            setOrders(formattedOrders);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                profiles:user_id (full_name, phone),
                guest_customers:guest_customer_id (full_name, phone, email),
                delivery_slots:delivery_slot_id (slot_date, start_time, end_time),
                rider:rider_id (full_name, phone),
                order_items (
                    id,
                    product_name,
                    weight_grams,
                    quantity,
                    unit_price,
                    subtotal
                )
            `)
            .eq('id', orderId)
            .single();

        if (!error) {
            setOrderDetails(data);
        }
    };

    const handleViewOrder = async (order) => {
        setSelectedOrder(order);
        await fetchOrderDetails(order.id);
    };

    const debugAuth = async () => {
        const { data: { user }, error } = await supabase.auth.getUser()

        console.log('AUTH USER:', user)
        console.log('AUTH UID:', user?.id)
        console.log('AUTH ERROR:', error)
    }

    const handleUpdateStatus = async (orderId, newStatus) => {
        await debugAuth()
        await supabase.auth.getSession().then(
            value => {
                console.log(value)
            }
        )

        console.log('ORDER ID:', orderId)
        console.log('NEW STATUS:', newStatus)

        const {data,error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        console.log('updated rows', data);
        console.log('error', error);


        if (!error) {
            console.log('123');
            await supabase
                .from('order_status_history')
                .insert({
                    order_id: orderId,
                    status: newStatus,
                    notes: `Status updated to ${newStatus} by usman`
                });

            fetchOrders();
            setSelectedOrder(null);
        }
    };

    const handleAssignRider = async (riderId) => {
        if (!selectedOrderForAssign) return;

        const { error } = await supabase
            .from('orders')
            .update({
                rider_id: riderId,
                rider_assigned_at: new Date().toISOString(),
                status: 'out_for_delivery'
            })
            .eq('id', selectedOrderForAssign.id);

        if (!error) {
            await supabase
                .from('order_status_history')
                .insert({
                    order_id: selectedOrderForAssign.id,
                    status: 'out_for_delivery',
                    notes: 'Order assigned to rider by admin'
                });

            fetchOrders();
            setShowAssignModal(false);
            setSelectedOrderForAssign(null);
            alert('Rider assigned successfully!');
        }
    };

    const handleUnassignRider = async (orderId) => {
        if (!confirm('Are you sure you want to unassign this rider?')) return;

        const { error } = await supabase
            .from('orders')
            .update({
                rider_id: null,
                rider_assigned_at: null,
                status: 'packed'
            })
            .eq('id', orderId);

        if (!error) {
            fetchOrders();
            alert('Rider unassigned successfully!');
        }
    };

    const statusConfig = {
        pending: {
            label: 'Pending',
            color: 'bg-yellow-100 text-yellow-800',
            icon: AlertCircle,
        },
        confirmed: {
            label: 'Confirmed',
            color: 'bg-blue-100 text-blue-800',
            icon: CheckCircle,
        },
        packed: {
            label: 'Packed',
            color: 'bg-purple-100 text-purple-800',
            icon: Package,
        },
        out_for_delivery: {
            label: 'Out for Delivery',
            color: 'bg-orange-100 text-orange-800',
            icon: Truck,
        },
        delivered: {
            label: 'Delivered',
            color: 'bg-green-100 text-green-800',
            icon: CheckCircle,
        },
        cancelled: {
            label: 'Cancelled',
            color: 'bg-red-100 text-red-800',
            icon: XCircle,
        }
    };

    const statusCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        packed: orders.filter(o => o.status === 'packed').length,
        out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage orders and assign riders</p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-max sm:min-w-0">
                        {Object.entries(statusCounts).map(([key, count]) => (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(key)}
                                className={`px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                                    statusFilter === key
                                        ? 'bg-green-50 text-green-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by order ID, customer name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Order ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rider</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {filteredOrders.map((order) => {
                            const StatusIcon = statusConfig[order.status]?.icon || AlertCircle;
                            return (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                                        <p className="text-sm text-gray-500">{order.orderDate}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{order.customer.name}</p>
                                        <p className="text-sm text-gray-500">{order.customer.phone}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {order.rider ? (
                                            <div>
                                                <p className="font-medium text-gray-900">{order.rider.full_name}</p>
                                                <p className="text-sm text-gray-500">{order.rider.phone}</p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedOrderForAssign(order);
                                                    setShowAssignModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                                            >
                                                <Bike className="w-4 h-4" />
                                                Assign Rider
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900">PKR {order.total}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            order.paymentMethod === 'cod'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit ${statusConfig[order.status]?.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {statusConfig[order.status]?.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleViewOrder(order)}
                                            className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 ml-auto"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
                {filteredOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status]?.icon || AlertCircle;
                    return (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-bold text-gray-900">{order.orderNumber}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{order.orderDate}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig[order.status]?.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig[order.status]?.label}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">{order.customer.name}</span>
                                </div>
                                {order.rider ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Bike className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">{order.rider.full_name}</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedOrderForAssign(order);
                                            setShowAssignModal(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                                    >
                                        <Bike className="w-4 h-4" />
                                        Assign Rider
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div>
                                    <p className="text-lg font-bold text-gray-900">PKR {order.total}</p>
                                    <p className="text-xs text-gray-500">{order.paymentMethod === 'cod' ? 'COD' : 'Online'}</p>
                                </div>
                                <button
                                    onClick={() => handleViewOrder(order)}
                                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm hover:bg-green-100"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && orderDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <XCircle className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                                    <p className="font-semibold text-gray-900">{selectedOrder.orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order Date</p>
                                    <p className="font-medium text-gray-900">{selectedOrder.orderDate}</p>
                                </div>
                            </div>

                            {/* Rider Info */}
                            {selectedOrder.rider && (
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">Rider Information</h3>
                                        <button
                                            onClick={() => handleUnassignRider(selectedOrder.id)}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Unassign
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Bike className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-900">{selectedOrder.rider.full_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">{selectedOrder.rider.phone}</span>
                                        </div>
                                        {selectedOrder.riderAssignedAt && (
                                            <p className="text-sm text-gray-500">
                                                Assigned: {new Date(selectedOrder.riderAssignedAt).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Customer Feedback */}
                            {selectedOrder.customerRating && (
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Customer Feedback</h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${
                                                    i < selectedOrder.customerRating
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                        <span className="text-sm text-gray-600">
                                            ({selectedOrder.customerRating}/5)
                                        </span>
                                    </div>
                                    {selectedOrder.customerFeedback && (
                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {selectedOrder.customerFeedback}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Customer Info */}
                            <div className="border-t pt-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">{selectedOrder.customer.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">{selectedOrder.customer.phone}</span>
                                    </div>
                                    {selectedOrder.customer.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">{selectedOrder.customer.email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                                        <span className="text-gray-600">{selectedOrder.address}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            {orderDetails.order_items && (
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                                    <div className="space-y-2">
                                        {orderDetails.order_items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.product_name}</p>
                                                    <p className="text-sm text-gray-500">{item.weight_grams}g × {item.quantity}</p>
                                                </div>
                                                <p className="font-semibold text-gray-900">PKR {item.subtotal}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <select
                                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    value={selectedOrder.status}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="packed">Packed</option>
                                    <option value="out_for_delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Rider Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-900">Assign Rider</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Order: {selectedOrderForAssign?.orderNumber}
                            </p>
                        </div>
                        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                            {riders.map((rider) => (
                                <button
                                    key={rider.id}
                                    onClick={() => handleAssignRider(rider.id)}
                                    className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <Bike className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900">{rider.full_name}</p>
                                        <p className="text-sm text-gray-500">{rider.phone}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-6 border-t flex justify-end">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedOrderForAssign(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersManagement;