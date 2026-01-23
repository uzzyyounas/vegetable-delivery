'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";

type Stat = {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    abandonedCarts: number;
    paymentStatus: { paid: number; pending: number };
    orderStatus: { pending: number; confirmed: number; out_for_delivery: number; delivered: number };
    pendingOrders: any[];
};

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stat | null>(null);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then((res) => res.json())
            .then(setStats);
    }, []);

    if (!stats) return <div className="p-6">Loading...</div>;

    const paymentData = [
        { name: "Paid", value: stats.paymentStatus.paid },
        { name: "Pending", value: stats.paymentStatus.pending },
    ];

    const orderStatusData = [
        { name: "Pending", value: stats.orderStatus.pending },
        { name: "Confirmed", value: stats.orderStatus.confirmed },
        { name: "Packed", value: stats.orderStatus.packed },
        { name: "Out for Delivery", value: stats.orderStatus.out_for_delivery },
        { name: "Delivered", value: stats.orderStatus.delivered },
        { name: "Cancelled", value: stats.orderStatus.cancelled },
    ];


    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-gray-500">Real-time business analytics</p>
                    </div>
                    <Link href="/admin/products" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                        Manage Products
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow">
                        <div className="text-gray-500">Total Revenue</div>
                        <div className="text-2xl font-bold">Rs {stats.totalRevenue.toFixed(2)}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow">
                        <div className="text-gray-500">Total Orders</div>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow">
                        <div className="text-gray-500">Average Order Value</div>
                        <div className="text-2xl font-bold">Rs {stats.avgOrderValue.toFixed(2)}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow">
                        <div className="text-gray-500">Abandoned Carts</div>
                        <div className="text-2xl font-bold">{stats.abandonedCarts}</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                    {/* Payment Donut */}
                    <div className="bg-white rounded-2xl p-5 shadow">
                        <h2 className="font-bold mb-3">Payment Status</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f59e0b" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Order Funnel */}
                    <div className="bg-white rounded-2xl p-5 shadow">
                        <h2 className="font-bold mb-3">Order Status Funnel</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={orderStatusData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Revenue Trend (Line) */}
                    <div className="bg-white rounded-2xl p-5 shadow">
                        <h2 className="font-bold mb-3">Revenue Trend</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={/* FETCH DAILY REVENUE */ []}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="revenue" stroke="#2563eb" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pending Orders Table */}
                <div className="bg-white rounded-2xl p-5 shadow mt-6">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold">Recent Pending Orders</h2>
                        <Link href="/admin/orders" className="text-blue-600">
                            View All
                        </Link>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-sm">Order</th>
                                <th className="p-3 text-sm">Amount</th>
                                <th className="p-3 text-sm">Status</th>
                                <th className="p-3 text-sm">Payment</th>
                            </tr>
                            </thead>
                            <tbody>
                            {stats.pendingOrders.map((o) => (
                                <tr key={o.order_number} className="border-t">
                                    <td className="p-3 text-sm">{o.order_number}</td>
                                    <td className="p-3 text-sm">Rs {o.total_amount}</td>
                                    <td className="p-3 text-sm">{o.status}</td>
                                    <td className="p-3 text-sm">{o.payment_status}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
