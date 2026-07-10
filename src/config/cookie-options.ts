// ===== SECURE COOKIE CONFIGURATION =====
export const secureCookieOptions = {
    httpOnly: true,   // JavaScript cannot access the cookie (prevents XSS token theft)
    secure: process.env.NODE_ENV === 'production', // only sent over HTTPS in production
    sameSite: 'strict' as const, // cookie not sent on cross-site requests (prevents CSRF)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    path: '/',
};

// ===== COOKIE FOR CLEARING (logout) =====
export const clearCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
};