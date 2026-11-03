"use client";

import { useState } from "react";

// Uploads straight to Cloudinary (signed by our server) and keeps an ordered list of URLs.
// The first image is the product's main photo. The list is submitted as a hidden field.
export default function ImageUploader({ initial }: { initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const added: string[] = [];
      for (const file of Array.from(files)) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(`${file.name}: only JPG, PNG or WebP.`);
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is over 10 MB.`);
        const sign = await fetch("/api/admin/cloudinary-sign", { method: "POST" });
        const s = await sign.json();
        if (!sign.ok) throw new Error(s.error ?? "Could not get an upload signature.");
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", s.apiKey);
        body.append("timestamp", String(s.timestamp));
        body.append("folder", s.folder);
        body.append("signature", s.signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: "POST", body });
        const out = await res.json();
        if (!res.ok) throw new Error(out.error?.message ?? "Upload failed.");
        added.push(out.secure_url);
      }
      setUrls((cur) => [...cur, ...added].slice(0, 12));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
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
        {busy ? "Uploading…" : "Upload photos"}
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || urls.length >= 12} className="hidden" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
      </label>
      <span className="ms-3 text-xs text-neutral-500">Up to 12 photos, 10 MB each. First one is the main photo.</span>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
