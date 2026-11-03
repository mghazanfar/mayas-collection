import "server-only";
import { createHash } from "node:crypto";

export function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

// Signed upload: the browser sends the file straight to Cloudinary, but only with a
// signature we issue to a logged-in admin. The API secret never leaves the server.
export function signUpload(params: Record<string, string | number>) {
  const cfg = cloudinaryConfig();
  if (!cfg) return null;
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + cfg.apiSecret).digest("hex");
  return { cloudName: cfg.cloudName, apiKey: cfg.apiKey, signature };
}
