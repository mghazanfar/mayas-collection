"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Lang } from "@/lib/i18n";
import type { Product } from "@/lib/product-types";
import ProductBrowser from "./ProductBrowser";

function Inner(props: { products: Product[]; lang: Lang; demo: boolean }) {
  const q = useSearchParams().get("q") ?? "";
  return <ProductBrowser {...props} query={q} showBrandFilter />;
}

// useSearchParams needs a Suspense boundary so the page can stay statically rendered.
export default function SearchBrowser(props: { products: Product[]; lang: Lang; demo: boolean }) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  );
}
