import { readFileSync } from 'node:fs';

const entries = JSON.parse(readFileSync(new URL('../redirects.json', import.meta.url), 'utf8'));
const errors = [];

if (!entries || Array.isArray(entries) || typeof entries !== 'object') {
  errors.push('redirects.json must be an object keyed by exact URL paths');
} else {
  for (const [path, entry] of Object.entries(entries)) {
    if (!path.startsWith('/') || path.includes('?') || path.includes('#') || path.includes(' ')) {
      errors.push(`${path}: must be a URL path beginning with /, without a query or fragment`);
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${path}: value must be an object like { "url": "https://...", "status": 302 }`);
      continue;
    }
    if (entry.status !== undefined && ![301, 302].includes(entry.status)) {
      errors.push(`${path}: status must be 301 or 302`);
    }
    try {
      const destination = new URL(entry.url);
      if (!['http:', 'https:'].includes(destination.protocol)) {
        errors.push(`${path}: destination must be an HTTP(S) URL`);
      }
    } catch {
      errors.push(`${path}: invalid destination URL`);
    }
  }
}

if (errors.length) {
  console.error(`Invalid redirects.json:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${Object.keys(entries).length} redirects`);
}
