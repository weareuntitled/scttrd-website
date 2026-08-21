export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN || 'dummy-local-token';
  const html = `<!doctype html><html><body><script>var t=${JSON.stringify(token)};window.opener.postMessage('authorization:github:success:'+JSON.stringify({token:t}),'*');window.close();</script></body></html>`;
  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
}
