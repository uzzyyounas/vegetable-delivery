import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookies) {
                    cookies.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 🔒 Not logged in
    if (!user) {
        return NextResponse.redirect(
            new URL('/login?admin=true', request.url)
        )
    }

    // 🔍 Check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // 🚫 Not admin
    if (profile?.role !== 'admin') {
        return NextResponse.redirect(
            new URL('/access-denied', request.url)
        )
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*'],
}