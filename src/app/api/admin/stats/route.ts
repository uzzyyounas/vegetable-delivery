import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET() {
    const supabase = createClient();

    // 1) Total revenue
    const { data: revenueData } = await supabase
        .from("orders")
        .select("total_amount");

    // 2) Total orders + status counts + payment counts
    const { data: ordersData } = await supabase
        .from("orders")
        .select("id, status, payment_status, total_amount, created_at");

    // 3) Abandoned carts
    const { count: abandonedCount } = await supabase
        .from("user_carts")
        .select("id", { count: "exact", head: true })
        .eq("status", "abandoned");

    // Build stats
    const totalRevenue =
        revenueData?.reduce((acc, item) => acc + Number(item.total_amount), 0) || 0;

    const totalOrders = ordersData?.length || 0;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    const paymentPaid =
        ordersData?.filter((o) => o.payment_status === "paid").length || 0;
    const paymentPending =
        ordersData?.filter((o) => o.payment_status === "pending").length || 0;

    // Order status counts
    const orderStatus = {
        pending: ordersData?.filter((o) => o.status === "pending").length || 0,
        confirmed: ordersData?.filter((o) => o.status === "confirmed").length || 0,
        packed: ordersData?.filter((o) => o.status === "packed").length || 0,
        out_for_delivery:
            ordersData?.filter((o) => o.status === "out_for_delivery").length || 0,
        delivered: ordersData?.filter((o) => o.status === "delivered").length || 0,
        cancelled: ordersData?.filter((o) => o.status === "cancelled").length || 0,
    };

    // Pending orders list (top 5)
    const pendingOrders = ordersData
        ?.filter((o) => o.status === "pending")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    return NextResponse.json({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        abandonedCarts: abandonedCount || 0,
        paymentStatus: { paid: paymentPaid, pending: paymentPending },
        orderStatus,
        pendingOrders,
    });
}
