import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import parser from 'accept-language-parser';

const locales = ['en', 'ja'];
const defaultLocale = 'en';

function getLocale(request: NextRequest) {
  // 1. Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const languages = parser.parse(acceptLanguage);
    for (const lang of languages) {
      if (locales.includes(lang.code)) {
        return lang.code;
      }
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public assets and api routes explicitly
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/icon.png') ||
    pathname.includes('/robots.txt') ||
    pathname.match(/\.(.*)$/) // Exclude all files with extensions
  ) {
    return;
  }

  // Check if pathname starts with any of the locales
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If already has locale, propagate URL to header for layout.tsx and return
  if (pathnameHasLocale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-url', request.url);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Redirect if there is no locale
  const locale = getLocale(request);
  const redirectUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
  
  const response = NextResponse.redirect(redirectUrl);
  // Set cookie for hydration integrity
  response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000 });
  return response;
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc.)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
