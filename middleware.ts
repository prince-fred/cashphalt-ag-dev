import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const response = await updateSession(request)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Protect Admin Routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/login'
            redirectUrl.searchParams.set('next', request.nextUrl.pathname)
            return NextResponse.redirect(redirectUrl)
        }
    }

    // Redirect logged-in users away from login page
    if (request.nextUrl.pathname.startsWith('/login')) {
        if (user) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/admin'
            return NextResponse.redirect(redirectUrl)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
