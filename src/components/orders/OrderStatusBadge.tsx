import { OrderStatus } from '@/lib/types/database.types'
import {CheckCircle, Clock, Package, Truck, XCircle} from "lucide-react";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
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
    const config = statusConfig[status]

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {config.label}
    </span>
    )
}