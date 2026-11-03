# Maya's Collection

Pakistani dresses storefront. Next.js + Supabase + Cloudinary, deployed on Netlify.

## Setup
1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill it in (never commit it).
3. `npm install && npm run dev`

Use Node 20.9+ (22 recommended).

## Admin login
Admin is at `/admin`. Credentials come from env vars:

```bash
npm run admin:hash   # asks for a password (min 12 chars), prints two values
```

Set these in `.env.local` and in Netlify (tick "Contains secret values"):

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (printed by the script)
- `ADMIN_SESSION_SECRET` (printed by the script)

Changing the password later: run the script again and update `ADMIN_PASSWORD_HASH`.
Changing `ADMIN_SESSION_SECRET` logs everyone out.

## Demo data
While the live catalog is empty a banner links to `/demo` (sample brands and products, noindex).
It disappears once a live brand and product exist.
