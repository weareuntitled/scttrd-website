export const config = {
  matcher: ['/admin/:path*', '/styleguide/:path*'],
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname === '/admin/config.yml' || url.pathname.endsWith('/config.yml')) {
    return fetch(request);
  }
  const isAdmin = url.pathname.startsWith('/admin');
  const password = isAdmin
    ? process.env.CMS_PASSWORD
    : process.env.STYLEGUIDE_PASSWORD;

  if (!password) {
    return new Response('Not configured', { status: 503 });
  }

  const auth = request.headers.get('authorization');
  const expected = `Basic ${btoa(`scttrd:${password}`)}`;

  if (auth !== expected) {
    return new Response('Authentication required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': `Basic realm="${isAdmin ? 'SCTTRD CMS' : 'SCTTRD Press'}", charset="UTF-8"`,
      },
    });
  }
  return fetch(request);
}
