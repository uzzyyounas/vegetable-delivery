// src/components/orders/OrderTracker.tsx
'use client'

import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'
import { OrderStatus } from '@/lib/types/database.types'

interface OrderTrackerProps {
    currentStatus: OrderStatus
    statusHistory?: Array<{
        status: OrderStatus
        created_at: string
        notes?: string | null
    }>
}

const statusConfig = {
    pending: {
        label: 'Order Placed',
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Your order has been received'
    },
    confirmed: {
        label: 'Confirmed',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Order confirmed and being prepared'
    },
    packed: {
        label: 'Packed',
        icon: Package,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        description: 'Your order is packed and ready'
    },
    out_for_delivery: {
        label: 'Out for Delivery',
        icon: Truck,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        description: 'On the way to your location'
    },
    delivered: {
        label: 'Delivered',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Order successfully delivered'
    },
    cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Order has been cancelled'
    }
}

const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered']

export default function OrderTracker({ currentStatus, statusHistory }: OrderTrackerProps) {
    const getCurrentStepIndex = () => {
        return statusOrder.indexOf(currentStatus)
    }

    const currentStepIndex = getCurrentStepIndex()
    const isCancelled = currentStatus === 'cancelled'

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return {
            date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
    }

    if (isCancelled) {
        const config = statusConfig.cancelled
        const Icon = config.icon

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`${config.bgColor} p-3 rounded-full`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{config.label}</h3>
                        <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                </div>
                {statusHistory && statusHistory.length > 0 && statusHistory[0].notes && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <p className="text-sm text-red-800">{statusHistory[0].notes}</p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Order Status</h3>

            {/* Status Timeline */}
            <div className="space-y-4">
                {statusOrder.map((status, index) => {
                    const config = statusConfig[status]
                    const Icon = config.icon
                    const isCompleted = index <= currentStepIndex
                    const isCurrent = index === currentStepIndex
                    const historyItem = statusHistory?.find(h => h.status === status)

                    return (
                        <div key={status} className="relative">
                            {/* Connecting Line */}
                            {index < statusOrder.length - 1 && (
                                <div
                                    className={`absolute left-5 top-12 w-0.5 h-12 ${
                                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                    }`}
                                />
                            )}

                            {/* Status Item */}
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div
                                    className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                        isCompleted
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4
                                            className={`font-medium ${
                                                isCurrent ? 'text-green-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                                            }`}
                                        >
                                            {config.label}
                                        </h4>
                                        {historyItem && (
                                            <div className="text-xs text-gray-500">
                                                <div>{formatDate(historyItem.created_at).date}</div>
                                                <div>{formatDate(historyItem.created_at).time}</div>
                                            </div>
                                        )}
                                    </div>
                                    <p
                                        className={`text-sm mt-1 ${
                                            isCompleted ? 'text-gray-600' : 'text-gray-400'
                                        }`}
                                    >
                                        {config.description}
                                    </p>
                                    {historyItem?.notes && (
                                        <p className="text-sm text-gray-500 mt-1 italic">"{historyItem.notes}"</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Current Status Badge */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">
            Current Status: <span className="text-green-600">{statusConfig[currentStatus].label}</span>
          </span>
                </div>
            </div>
        </div>
    )
}

// EXPORT this function so it can be used in admin panel
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    const config = statusConfig[status]

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {config.label}
    </span>
    )
}