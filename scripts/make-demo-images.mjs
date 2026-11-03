// Generates simple illustrated placeholder photos into public/demo/*.svg
// (stand-ins until real product photos are uploaded). Run: node scripts/make-demo-images.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/demo/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const PRODUCTS = {
  "lawn-mint":      { base: "#8fd3b6", accent: "#2f7d62", bg: ["#eef8f3", "#d4efe3"], pattern: "dots" },
  "lawn-peach":     { base: "#f6b49a", accent: "#b9573a", bg: ["#fff3ec", "#fbd9c8"], pattern: "dots" },
  "chiffon-rose":   { base: "#e58fa3", accent: "#8f2c47", bg: ["#fdf0f3", "#f7cfd9"], pattern: "floral" },
  "bridal-maroon":  { base: "#8c1f3a", accent: "#e8c36a", bg: ["#f8ecee", "#e8c8cf"], pattern: "border" },
  "kurta-white":    { base: "#f4f1ea", accent: "#9a8f7a", bg: ["#f7f5f0", "#e6e1d6"], pattern: "stripes" },
  "khaddar-teal":   { base: "#3f8f94", accent: "#17484c", bg: ["#e9f4f4", "#c3e1e2"], pattern: "stripes" },
  "organza-lilac":  { base: "#b9a3dd", accent: "#5b43a0", bg: ["#f3effa", "#dcd2f0"], pattern: "floral" },
  "silk-gold":      { base: "#d9a441", accent: "#7a5410", bg: ["#fbf5e6", "#f0deb0"], pattern: "border" },
};

function pattern(kind, c) {
  if (kind === "dots") return `<pattern id="p" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="3.2" fill="${c}" opacity=".55"/></pattern>`;
  if (kind === "stripes") return `<pattern id="p" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="5" height="18" fill="${c}" opacity=".35"/></pattern>`;
  if (kind === "floral") return `<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse"><g fill="${c}" opacity=".5"><circle cx="22" cy="12" r="5"/><circle cx="12" cy="24" r="5"/><circle cx="32" cy="24" r="5"/><circle cx="22" cy="32" r="5"/></g><circle cx="22" cy="22" r="3.5" fill="#fff" opacity=".7"/></pattern>`;
  return `<pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 L20 0 L40 20 L20 40Z" fill="none" stroke="${c}" stroke-width="2" opacity=".6"/></pattern>`;
}

const frame = (bg, body, defs = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>${defs}</defs>
<rect width="600" height="800" fill="url(#g)"/>${body}</svg>`;

// Standing figure: head, neck, kurta, trousers, dupatta.
function figure(p, back) {
  const neck = back ? "" : `<path d="M262 210 Q300 262 338 210 Q300 232 262 210Z" fill="${p.accent}" opacity=".55"/>`;
  return `
  <ellipse cx="300" cy="755" rx="150" ry="14" fill="#000" opacity=".08"/>
  <circle cx="300" cy="120" r="46" fill="#e9c9ac"/>
  <rect x="284" y="160" width="32" height="48" fill="#e9c9ac"/>
  <path d="M215 205 Q300 180 385 205 L420 470 Q300 500 180 470Z" fill="${p.base}"/>
  <path d="M215 205 Q300 180 385 205 L420 470 Q300 500 180 470Z" fill="url(#p)"/>
  <path d="M215 205 L150 420 L185 435 L240 290Z" fill="${p.base}"/><path d="M385 205 L450 420 L415 435 L360 290Z" fill="${p.base}"/>
  <path d="M215 205 L150 420 L185 435 L240 290Z M385 205 L450 420 L415 435 L360 290Z" fill="url(#p)"/>
  ${neck}
  <path d="M215 460 Q300 490 385 460 L398 480 Q300 512 202 480Z" fill="${p.accent}"/>
  <path d="M232 485 L262 748 L300 748 L300 500Z M368 485 L338 748 L300 748 L300 500Z" fill="${p.accent}" opacity=".85"/>
  <path d="M225 215 Q150 330 205 560 L235 548 Q200 350 262 232Z" fill="${p.accent}" opacity=".35"/>`;
}

function detail(p) {
  return `<rect x="40" y="60" width="520" height="680" rx="14" fill="${p.base}"/>
  <rect x="40" y="60" width="520" height="680" rx="14" fill="url(#p)"/>
  <rect x="40" y="620" width="520" height="70" fill="${p.accent}"/>
  <path d="M40 620 H560" stroke="#fff" stroke-width="3" stroke-dasharray="10 8" opacity=".7"/>
  <rect x="40" y="60" width="520" height="680" rx="14" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="4"/>`;
}

function flat(p) {
  return `<rect x="70" y="150" width="460" height="230" rx="10" fill="${p.base}"/><rect x="70" y="150" width="460" height="230" rx="10" fill="url(#p)"/>
  <rect x="90" y="410" width="420" height="190" rx="10" fill="${p.accent}"/>
  <rect x="110" y="630" width="380" height="110" rx="10" fill="${p.base}" opacity=".85"/><rect x="110" y="630" width="380" height="110" rx="10" fill="url(#p)"/>`;
}

for (const [name, p] of Object.entries(PRODUCTS)) {
  const defs = pattern(p.pattern, p.accent);
  const views = { 1: frame(p.bg, figure(p, false), defs), 2: frame(p.bg, detail(p), defs), 3: frame(p.bg, figure(p, true), defs), 4: frame(p.bg, flat(p), defs) };
  for (const [n, svg] of Object.entries(views)) writeFileSync(new URL(`${name}-${n}.svg`, OUT), svg);
}
console.log("wrote", Object.keys(PRODUCTS).length * 4, "images");
