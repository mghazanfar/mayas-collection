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

## Things the owner must do before taking real orders
1. Supabase: re-run `supabase/schema.sql` (it is safe to run again) whenever it changes.
2. Admin > Shipping: enter real courier prices (from each courier's own price list) and tick **Verified**.
   Until then real orders get no delivery options. Demo carts use made-up example rates.
3. Admin > Settings: owner email/WhatsApp, return address, NTN, bank details, fees.
4. Cloudinary keys (photo upload) and, optionally, Resend / WhatsApp keys (order alerts).
5. Online card/wallet payments (HBL, JazzCash, EasyPaisa) are not connected yet. Today: cash on
   delivery (Pakistan) and bank transfer (everywhere). The checkout shows "card: coming soon".

## Where things are
- `src/lib/shipping.ts`: delivery and fee maths (shared by quote and final order total)
- `src/app/actions/shop.ts`: public server actions (quote, place order, track, return request)
- `src/app/(admin)/admin/`: admin pages and actions (every action re-checks the login)
- `scripts/make-demo-images.mjs`: regenerates the placeholder demo pictures in `public/demo`
