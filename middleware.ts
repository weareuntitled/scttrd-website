export const config = {
  matcher: ['/admin/:path*', '/styleguide/:path*'],
};

function loginHtml(realm: string, error = '') {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${realm}</title><style>body{background:#0c0c0c;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}form{background:#111;padding:32px;border-radius:12px;width:320px}input{width:100%;padding:12px;margin:12px 0;border-radius:6px;border:1px solid #333;background:#222;color:#fff;font-size:16px}button{width:100%;padding:12px;background:red;color:#000;border:0;border-radius:6px;font-weight:700;cursor:pointer}h1{font-size:18px;margin:0 0 8px}p{color:#888;font-size:14px;margin:0}.error{color:red;font-size:13px;margin-top:8px}</style></head><body><form method="POST"><h1>${realm}</h1><p>Passwort eingeben</p><input type="password" name="password" placeholder="Passwort" autofocus required><button type="submit">Einloggen</button>${error ? `<div class="error">${error}</div>` : ''}</form></body></html>`;
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname === '/admin/config.yml' || url.pathname.endsWith('/config.yml')) {
    return fetch(request);
  }
  const isAdmin = url.pathname.startsWith('/admin');
  const cookieName = isAdmin ? 'scttrd_cms' : 'scttrd_press';
  const password = isAdmin ? process.env.CMS_PASSWORD : process.env.STYLEGUIDE_PASSWORD;
  const realm = isAdmin ? 'SCTTRD CMS' : 'SCTTRD Press Pack';

  if (!password) {
    return new Response('Not configured', { status: 503 });
  }

  const cookies = request.headers.get('cookie') || '';
  if (cookies.includes(`${cookieName}=1`)) {
    return fetch(request);
  }

  if (request.method === 'POST') {
    const form = await request.formData();
    const pw = String(form.get('password') || '');
    if (pw === password) {
      const res = Response.redirect(url.href, 303);
      res.headers.set('Set-Cookie', `${cookieName}=1; Path=${isAdmin ? '/admin' : '/styleguide'}; Max-Age=86400; SameSite=Lax`);
      return res;
    }
    return new Response(loginHtml(realm, 'Falsches Passwort'), {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new Response(loginHtml(realm), {
    status: 401,
    headers: { 'Content-Type': 'text/html' },
  });
}
