import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { signUpload } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const FOLDER = "mayas-collection/products";

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = signUpload({ folder: FOLDER, timestamp });
  if (!signed) return NextResponse.json({ error: "Cloudinary is not configured on the server." }, { status: 503 });
  return NextResponse.json({ ...signed, timestamp, folder: FOLDER });
}
