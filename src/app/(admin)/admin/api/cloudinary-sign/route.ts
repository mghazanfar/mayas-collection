import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { signUpload } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const FOLDER = "mayas-collection/products";

// Lives under /admin (not /api/admin) on purpose: the admin session cookie is scoped
// to path=/admin, so the browser only sends it to URLs under /admin. At /api/admin
// the cookie never arrived and every upload was refused as "Not logged in".
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Your admin session has expired. Please log in again.", code: "auth" }, { status: 401 });
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = signUpload({ folder: FOLDER, timestamp });
  if (!signed) return NextResponse.json({ error: "Cloudinary is not configured on the server." }, { status: 503 });
  return NextResponse.json({ ...signed, timestamp, folder: FOLDER }, { headers: { "cache-control": "no-store" } });
}
