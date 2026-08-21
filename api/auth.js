export default async function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).send('OAuth not configured');
  }
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');
  if (!code) {
    const redirect = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${encodeURIComponent(`https://${req.headers.host}/api/auth`)}`;
    return res.redirect(redirect);
  }
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const data = await tokenRes.json();
  const token = data.access_token;
  if (!token) return res.status(401).send('No token');
  const html = `<!doctype html><html><body><script>window.opener.postMessage('authorization:github:success:${JSON.stringify({ token })}', '*'); window.close();</script></body></html>`;
  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
}
