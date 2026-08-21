export const config = {
  matcher: ['/admin/:path*', '/styleguide/:path*'],
};

function loginHtml(realm: string, error = '') {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${realm}</title><style>body{background:#0c0c0c;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}form{background:#111;padding:32px;border-radius:12px;width:320px}input{width:100%;padding:12px;margin:12px 0;border-radius:6px;border:1px solid #333;background:#222;color:#fff;font-size:16px}button{width:100%;padding:12px;background:red;color:#000;border:0;border-radius:6px;font-weight:700;cursor:pointer}h1{font-size:18px;margin:0 0 8px}p{color:#888;font-size:14px;margin:0}.error{color:red;font-size:13px;margin-top:8px}</style></head><body><form method="POST"><h1>${realm}</h1><p>Passwort eingeben</p><input type="password" name="password" placeholder="Passwort" autofocus required><button type="submit">Einloggen</button>${error ? `<div class="error">${error}</div>` : ''}</form></body></html>`;
}

export default async function middleware(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.pathname === '/admin/config.yml' || url.pathname.endsWith('/config.yml')) {
      return fetch(request);
    }
    const isAdmin = url.pathname.startsWith('/admin');
    const pw = isAdmin
      ? (typeof process !== 'undefined' ? (process as any).env?.CMS_PASSWORD : undefined)
      : (typeof process !== 'undefined' ? (process as any).env?.STYLEGUIDE_PASSWORD : undefined);

    if (!pw) {
      return fetch(request);
    }

    const cookies = request.headers.get('cookie') || '';
    const name = isAdmin ? 'scttrd_cms' : 'scttrd_press';
    if (cookies.includes(`${name}=1`)) {
      return fetch(request);
    }

    if (request.method === 'POST') {
      try {
        const form = await request.formData();
        const v = String(form.get('password') || '');
        if (v === pw) {
          const target = isAdmin ? '/admin/' : '/styleguide/';
          return new Response(null, {
            status: 303,
            headers: {
              Location: target,
              'Set-Cookie': `${name}=1; Path=${isAdmin ? '/admin' : '/styleguide'}; Max-Age=86400; SameSite=Lax`,
            },
          });
        }
        return new Response(loginHtml(isAdmin ? 'SCTTRD CMS' : 'SCTTRD Press Pack', 'Falsches Passwort'), {
          status: 401,
          headers: { 'Content-Type': 'text/html' },
        });
      } catch {}
    }

    return new Response(loginHtml(isAdmin ? 'SCTTRD CMS' : 'SCTTRD Press Pack'), {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch {
    return fetch(request);
  }
}
