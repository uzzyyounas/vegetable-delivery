// import { createBrowserClient } from '@supabase/ssr'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
