import { NextRequest, NextResponse } from 'next/server';

// Paths that don't require an admin session.
const PUBLIC_PATHS = ['/', '/legal'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// IMPORTANT LIMITATION: this is only a coarse *presence* check on the
// ranzo_admin_token cookie. Next.js Edge middleware can't verify a JWT's
// signature or expiry here without extra plumbing (a jose-based verify using
// the same signing secret, or an edge-safe call back to the API). A forged
// or expired cookie will still pass this check and reach the page shell.
// Real authorization is enforced on every API call by the backend's
// verify_admin dependency — this middleware exists purely to stop serving
// the admin page shell/JS bundle to obviously logged-out visitors.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('ranzo_admin_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
