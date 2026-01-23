import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET() {
    const supabase = createClient();

    const { data } = await supabase
        .from("orders")
        .select("created_at, total_amount");

    const daily: Record<string, number> = {};

    data?.forEach((o) => {
        const date = new Date(o.created_at).toISOString().slice(0, 10);
        daily[date] = (daily[date] || 0) + Number(o.total_amount);
    });

    const result = Object.keys(daily)
        .sort()
        .map((date) => ({ date, revenue: daily[date] }));

    return NextResponse.json(result);
}
