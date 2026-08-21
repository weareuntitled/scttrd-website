declare const Deno: {
  env: { get: (name: string) => string | undefined };
};

export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const password = Deno.env.get('CMS_PASSWORD');
  if (!password) {
    return new Response('CMS not configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  const expected = `Basic ${btoa(`scttrd:${password}`)}`;
  if (request.headers.get('authorization') !== expected) {
    return new Response('Authentication required.', {
      status: 401,
      headers: {
        'Cache-Control': 'no-store',
        'WWW-Authenticate': 'Basic realm="SCTTRD CMS", charset="UTF-8"',
      },
    });
  }
  return context.next();
};
