import { href, type Lang } from "./i18n";
import { SITE_URL } from "./site";

// Canonical + hreflang for a page path like "/products/x".
export function alternatesFor(lang: Lang, path: string) {
  return {
    canonical: `${SITE_URL}${href(lang, path)}`,
    languages: {
      en: `${SITE_URL}${href("en", path)}`,
      "ur-Latn": `${SITE_URL}${href("roman", path)}`,
      ur: `${SITE_URL}${href("ur", path)}`,
      "x-default": `${SITE_URL}${href("en", path)}`,
    },
  };
}
