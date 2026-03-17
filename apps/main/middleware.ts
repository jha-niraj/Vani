import { withAuth, type NextRequestWithAuth } from "@repo/auth/middleware"
import { NextResponse } from "next/server"

// Protected routes that require authentication (only core user-specific functionality)
const protectedRoutes = [
	'/home',
	'/profile',
	'/settings',
	'/interact',
	'/library',
    '/tasks'
]

// Public routes that don't require authentication (allow exploration)
const publicRoutes = [
	'/',
	'/error',
	'/aboutus',
	'/careers',
	'/onboarding',
]

// API routes that should be excluded from auth checks
const apiRoutes = [
	'/api/auth',
	'/api/health',
	'/api/user',
	'/api/webhooks',
	'/api/register',
	'/api/verifyemail',
	'/api/forgotpassword',
	'/api/resend-verification',
	'/api/user/verify-status',
	'/api/auth/verify-password'
]

export default withAuth(
	function middleware(req: NextRequestWithAuth) {
		const { nextUrl } = req
		const isLoggedIn = !!req.nextauth.token
		const onboardingCompleted = req.nextauth.token?.onboardingCompleted || false

		console.log(`Middleware: ${nextUrl.pathname}, isLoggedIn: ${isLoggedIn}, onboarding: ${onboardingCompleted}`) // Debug log

		// Allow API routes to pass through
		if (apiRoutes.some(route => nextUrl.pathname.startsWith(route))) {
			return NextResponse.next()
		}

		// Allow static files and Next.js internals
		if (
			nextUrl.pathname.startsWith('/_next/') ||
			nextUrl.pathname.startsWith('/api/') ||
			nextUrl.pathname.includes('.')
		) {
			return NextResponse.next()
		}

		// Check if current path is a protected route
		const isProtectedRoute = protectedRoutes.some(route =>
			nextUrl.pathname.startsWith(route)
		)

		// Check if current path is a public route
		const isPublicRoute = publicRoutes.some(route =>
			nextUrl.pathname === route || (route !== '/' && nextUrl.pathname.startsWith(route))
		)

		// If user is not logged in and trying to access protected route
		if (!isLoggedIn && isProtectedRoute) {
			const signInUrl = new URL('/', nextUrl.origin)
			signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
			return NextResponse.redirect(signInUrl)
		}

		// Handle post-login redirection logic
		if (isLoggedIn) {
			// Check onboarding status
			if (!onboardingCompleted && nextUrl.pathname !== '/onboarding' && nextUrl.pathname !== '/verify') {
				// Redirect to onboarding if not completed (except verify and onboarding itself)
				return NextResponse.redirect(new URL('/onboarding', nextUrl.origin))
			}

			// If onboarding is completed and user tries to access onboarding page, redirect to home
			if (onboardingCompleted && nextUrl.pathname === '/onboarding') {
				return NextResponse.redirect(new URL('/home', nextUrl.origin))
			}

			// If user is trying to access signin/register, redirect based on onboarding status
			if (nextUrl.pathname === '/') {
				const redirectUrl = onboardingCompleted ? '/home' : '/onboarding'
				return NextResponse.redirect(new URL(redirectUrl, nextUrl.origin))
			}

			// For the root path, redirect authenticated users based on onboarding status
			if (nextUrl.pathname === '/') {
				const redirectUrl = onboardingCompleted ? '/home' : '/onboarding'
				return NextResponse.redirect(new URL(redirectUrl, nextUrl.origin))
			}
		}

		return NextResponse.next()
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				const { pathname } = req.nextUrl

				// Allow access to public routes
				if (publicRoutes.some(route =>
					pathname === route || (route !== '/' && pathname.startsWith(route))
				)) {
					return true
				}

				// Allow access to API routes
				if (apiRoutes.some(route => pathname.startsWith(route))) {
					return true
				}

				// Check if route is protected
				const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

				// If it's a protected route, require authentication
				if (isProtectedRoute) {
					return !!token
				}

				// Allow everything else
				return true
			},
		},
		pages: {
			signIn: '/',
		},
	}
)

export const config = {
	// More specific matcher to avoid catching static files and API routes
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder files
		 * - files with extensions (images, etc.)
		 * - webhook endpoints
		 */
		'/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico|public/|.*\\..*).*)',
	],
}