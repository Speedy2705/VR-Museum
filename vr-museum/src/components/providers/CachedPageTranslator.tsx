"use client";

import { useEffect } from "react";
import { useI18n } from "@/context/I18nContext";
import cache from "@/translations/cache.json";

const attributes = ["placeholder", "title", "aria-label"] as const;

export default function CachedPageTranslator() {
  const { locale } = useI18n();
  useEffect(() => {
    if (locale === "en") return;
    const dictionary = cache[locale] as Record<string, string>;
    const translate = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const element = node.parentElement;
        if (!element || element.closest("script, style, code, pre, [data-no-translate]") || element.closest("input, textarea")) continue;
        const original = node.textContent?.trim();
        if (original && dictionary[original]) node.textContent = node.textContent!.replace(original, dictionary[original]);
      }
      const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
      for (const element of elements) for (const attribute of attributes) {
        const original = element.getAttribute(attribute);
        if (original && dictionary[original]) element.setAttribute(attribute, dictionary[original]);
      }
    };
    translate(document.body);
    const observer = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof Element) translate(node);
    })));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);
  return null;
}
