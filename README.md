# rmw.li - Cloudflare Worker redirects

GitHub is the source of truth for the redirect list. No PHP, MySQL, KV, or D1 required.

## Prerequisites

- An active Cloudflare account and a GitHub account.
- `rmw.li` configured as an active DNS zone on Cloudflare **before the production cutover**.
- Node.js 20+ for local development.

## Develop locally

```bash
npm install
npm run validate
npm test
npm run dev
```

`npm run dev` launches the local Worker (usually at http://127.0.0.1:8787).
Test without following the redirect: `curl -i http://127.0.0.1:8787/demo`.
Commit the generated `package-lock.json` to GitHub with the other files.

## Redirects

Edit `redirects.json`, for example:

```json
{
  "/partner": {"url": "https://www.example.org/partners", "status": 302},
  "/annual": {"url": "https://www.example.org/annual-report", "status": 301}
}
```

- Redirect path is matched **exactly** (case-sensitive; `/partner` and `/partner/` differ).
- Incoming query parameters are appended to the destination query parameters.
- A URL missing from the JSON returns a 404, including `/` unless you add an entry for it.
- `301` is only for genuinely permanent destinations; clients may cache it.
- Only `GET` and `HEAD` methods redirect; others receive 405.
- URL schemes must be HTTP or HTTPS.
- These JSON redirects are shipped with the Worker bundle at deployment; a change requires a new deployment.

## Deploy from GitHub

1. Create a private GitHub repository named `rmw-li`, push the files in this project, and set `main` as the production branch.
2. In Cloudflare choose **Workers & Pages → Create application → GitHub** and select the repository.
3. Set Worker name to `rmw-li` (must match wrangler.jsonc), root directory to `/` (repo root), and production branch to `main`.
4. Set **Build command** to `npm run validate && npm test` (optional but recommended). Set **Deploy command** to `npx wrangler deploy`.
5. Deploy. Test `https://rmw-li.<your-account>.workers.dev/demo` before routing the real domain.
6. For production, ensure `rmw.li` is an active Cloudflare DNS zone. Remove conflicting old apex A/AAAA/CNAME records at cutover.
7. Uncomment the `routes` entry in `wrangler.jsonc`, adding a comma after `"workers_dev": true` as explained by the comments. Commit to `main`. Cloudflare then deploys the Worker as a Custom Domain and provisions the DNS/certificate association.
8. Confirm your real paths redirect with expected `Location` and status. Keep the old PHP instance and MySQL dump temporarily for rollback.

Example checking response headers without following the redirect:

```bash
curl -I https://rmw.li/demo
curl -I 'https://rmw.li/demo?utm_source=email'
curl -I https://rmw.li/not-found
```

## MySQL migration

Export a list of `(short_code, destination_url, status_code)` from your existing DB, then convert rows into the `redirects.json` structure. Check any special PHP routing behavior before switching: case sensitivity, trailing slashes, percent encoding, query forwarding, legacy 301/302 codes, and whether click statistics need to be retained. Do not discard the MySQL dump until you have compared a representative sample of old and new links.

## Updating links

Edit `redirects.json` → open a GitHub PR → review → merge to `main` → Cloudflare builds, validates, and deploys the new Worker automatically.

## Notes

- If you also use `www.rmw.li`, configure it separately; Cloudflare Custom Domains match exact hostnames.
- This setup does not store per-link click counters. Workers analytics can show overall service traffic; advanced per-link tracking needs more development.
- Changes to a `301` may not reach users whose browser has cached the old permanent redirect. Prefer `302` for mutable links.
