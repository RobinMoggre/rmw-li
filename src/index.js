import redirects from '../redirects.json' with { type: 'json' };

export default {
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' }
      });
    }

    const source = new URL(request.url);
    const entry = Object.hasOwn(redirects, source.pathname)
      ? redirects[source.pathname]
      : undefined;

    if (!entry) {
      return new Response('Short link not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }

    // Entries are verified at deploy time by npm run validate.
    const destination = new URL(entry.url);

    // Keep incoming query parameters, including duplicate keys. If a target
    // already has query parameters, incoming ones are appended after them.
    for (const [key, value] of source.searchParams) {
      destination.searchParams.append(key, value);
    }

    return new Response(null, {
      status: entry.status ?? 302,
      headers: {
        Location: destination.toString(),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer'
      }
    });
  }
};
