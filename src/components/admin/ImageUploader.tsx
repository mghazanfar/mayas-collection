"use client";

import { useState } from "react";

const MAX_SIDE = 2000; // px; plenty for zoomable product photos
const TARGET_BYTES = 1.5 * 1024 * 1024;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

// Phone photos are often 3-8 MB / 4000px+. Shrink them in the browser before upload so
// uploads are fast on mobile data and stay well under Cloudinary's 10 MB limit.
async function shrink(file: File): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (file.size <= 10 * 1024 * 1024) return file; // can't decode here; let Cloudinary try
    throw new Error("could not read this photo. Please save it as JPG and try again.");
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size <= TARGET_BYTES) {
    bmp.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const type = file.type === "image/png" ? "image/webp" : "image/jpeg"; // webp keeps PNG transparency
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.85));
  return blob && blob.size < file.size ? blob : file;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// Uploads straight to Cloudinary (signed by our server) and keeps an ordered list of URLs.
// The first image is the product's main photo. The list is submitted as a hidden field.
// Files go one at a time; each photo that succeeds is kept even if a later one fails.
export default function ImageUploader({ initial }: { initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  async function uploadOne(file: File): Promise<string> {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("only JPG, PNG or WebP photos are supported.");
    if (file.size > MAX_INPUT_BYTES) throw new Error("this photo is over 25 MB.");
    const blob = await shrink(file);

    let sign: Response;
    try {
      sign = await fetch("/admin/api/cloudinary-sign", { method: "POST", cache: "no-store", credentials: "same-origin" });
    } catch {
      throw new Error("no internet connection. Check your connection and try again.");
    }
    const s = await readJson(sign);
    if (!sign.ok) {
      throw new Error(String(s.error ?? (sign.status === 401 ? "your session expired, please log in again." : `server error (${sign.status}). Please try again.`)));
    }

    const body = new FormData();
    body.append("file", blob, file.name);
    body.append("api_key", String(s.apiKey));
    body.append("timestamp", String(s.timestamp));
    body.append("folder", String(s.folder));
    body.append("signature", String(s.signature));
    let res: Response;
    try {
      res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: "POST", body });
    } catch {
      throw new Error("upload interrupted. Check your connection and try again.");
    }
    const out = await readJson(res);
    const msg = (out.error as { message?: string } | undefined)?.message;
    if (!res.ok || typeof out.secure_url !== "string") throw new Error(msg ? `image host said: ${msg}` : `upload failed (${res.status}).`);
    return out.secure_url;
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const room = 12 - urls.length;
    const list = Array.from(files);
    const picked = list.slice(0, Math.max(0, room));
    const errs: string[] = [];
    if (list.length > picked.length) errs.push(`Only ${room} more photo(s) fit (12 max); the rest were skipped.`);
    setErrors([]);
    for (let i = 0; i < picked.length; i++) {
      setBusy(`Uploading ${i + 1} of ${picked.length}…`);
      try {
        const url = await uploadOne(picked[i]);
        setUrls((cur) => [...cur, url].slice(0, 12));
      } catch (e) {
        errs.push(`${picked[i].name}: ${e instanceof Error ? e.message : "upload failed."}`);
      }
    }
    setBusy("");
    setErrors(errs);
  }

  const move = (i: number, d: number) =>
    setUrls((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <input type="hidden" name="images" value={urls.join("\n")} />
      <div className="flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div key={u} className="w-28 text-center text-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`Image ${i + 1}`} className="h-36 w-28 rounded border border-neutral-200 object-cover" />
            <p className="mt-1 text-neutral-500">{i === 0 ? "Main" : `#${i + 1}`}</p>
            <div className="mt-1 flex justify-center gap-1">
              <button type="button" onClick={() => move(i, -1)} className="rounded border px-2" aria-label="Move earlier">←</button>
              <button type="button" onClick={() => move(i, 1)} className="rounded border px-2" aria-label="Move later">→</button>
              <button type="button" onClick={() => setUrls((c) => c.filter((x) => x !== u))} className="rounded border px-2 text-red-600" aria-label="Remove">×</button>
            </div>
          </div>
        ))}
      </div>
      <label className="mt-3 inline-block cursor-pointer rounded border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50">
        {busy || "Upload photos"}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={Boolean(busy) || urls.length >= 12} className="hidden" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
      </label>
      <span className="ms-3 text-xs text-neutral-500">Up to 12 photos. Large phone photos are resized automatically. First one is the main photo.</span>
      {errors.length > 0 && (
        <div role="alert" className="mt-2 text-sm text-red-600">
          {errors.map((e) => <p key={e}>{e}</p>)}
        </div>
      )}
    </div>
  );
}
