"use client";

import { useEffect } from "react";
import { TRANSLATION_POLICY_VERSION } from "@/lib/translation-policy";
import { useI18n } from "@/context/I18nContext";

const attributes = ["placeholder", "title", "aria-label", "alt"] as const;
const excludedText = "script, style, code, pre, [data-no-translate], input, textarea";
const excludedElement = "script, style, code, pre, [data-no-translate]";

type AttributeName = (typeof attributes)[number] | "content";

function translatableAttributes(element: Element): AttributeName[] {
  return element.matches("meta[name='description'], meta[property='og:title'], meta[property='og:description']")
    ? [...attributes, "content"]
    : [...attributes];
}

function collect(
  root: ParentNode,
  dictionary: Record<string, string>,
  textSources: WeakMap<Node, string>,
  attributeSources: WeakMap<Element, Map<AttributeName, string>>,
) {
  const phrases = new Set<string>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const element = node.parentElement;
    const value = node.textContent?.replace(/\s+/g, " ").trim();
    if (!element || element.closest(excludedText) || !value) continue;
    const stored = textSources.get(node);
    const source = stored && dictionary[stored] === value ? stored : value;
    textSources.set(node, source);
    if (/[A-Za-z]/.test(source)) phrases.add(source);
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  for (const element of elements) {
    if (element.closest(excludedElement)) continue;
    for (const attribute of translatableAttributes(element)) {
      const value = element.getAttribute(attribute)?.trim();
      if (!value) continue;
      const sources = attributeSources.get(element) ?? new Map<AttributeName, string>();
      const stored = sources.get(attribute);
      const source = stored && dictionary[stored] === value ? stored : value;
      sources.set(attribute, source);
      attributeSources.set(element, sources);
      if (/[A-Za-z]/.test(source)) phrases.add(source);
    }
  }
  return [...phrases];
}

function apply(
  root: ParentNode,
  dictionary: Record<string, string>,
  textSources: WeakMap<Node, string>,
  attributeSources: WeakMap<Element, Map<AttributeName, string>>,
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const element = node.parentElement;
    const value = node.textContent?.replace(/\s+/g, " ").trim();
    if (!element || element.closest(excludedText) || !value) continue;
    const stored = textSources.get(node);
    const source = stored && dictionary[stored] === value ? stored : value;
    textSources.set(node, source);
    if (dictionary[source] && value !== dictionary[source]) {
      node.textContent = node.textContent!.replace(node.textContent!.trim(), dictionary[source]);
    }
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  for (const element of elements) for (const attribute of translatableAttributes(element)) {
    if (element.closest(excludedElement)) continue;
    const value = element.getAttribute(attribute)?.trim();
    if (!value) continue;
    const sources = attributeSources.get(element) ?? new Map<AttributeName, string>();
    const stored = sources.get(attribute);
    const source = stored && dictionary[stored] === value ? stored : value;
    sources.set(attribute, source);
    attributeSources.set(element, sources);
    if (dictionary[source] && value !== dictionary[source]) element.setAttribute(attribute, dictionary[source]);
  }
}

export default function CachedPageTranslator() {
  const { locale } = useI18n();
  useEffect(() => {
    if (locale === "en") return;
    const storageKey = `museum-gemini-translations:${TRANSLATION_POLICY_VERSION}:${locale}`;
    let dictionary: Record<string, string> = {};
    try { dictionary = JSON.parse(localStorage.getItem(storageKey) ?? "{}"); } catch { dictionary = {}; }
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    let running = false;
    let rerun = false;
    const textSources = new WeakMap<Node, string>();
    const attributeSources = new WeakMap<Element, Map<AttributeName, string>>();

    async function translate() {
      if (running) {
        rerun = true;
        return;
      }
      running = true;
      try {
        apply(document.documentElement, dictionary, textSources, attributeSources);
        const missing = collect(document.documentElement, dictionary, textSources, attributeSources)
          .filter((phrase) => !dictionary[phrase])
          .slice(0, 120);
        if (!missing.length) return;
        const response = await fetch("/api/translations", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ locale, phrases: missing }),
        });
        if (!response.ok || stopped) return;
        const body = await response.json();
        dictionary = { ...dictionary, ...body.data.translations };
        localStorage.setItem(storageKey, JSON.stringify(dictionary));
        apply(document.documentElement, dictionary, textSources, attributeSources);
      } finally {
        running = false;
        if (rerun && !stopped) {
          rerun = false;
          void translate();
        }
      }
    }

    void translate();
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => void translate(), 250);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [...attributes, "content"],
      characterData: true,
      childList: true,
      subtree: true,
    });
    return () => { stopped = true; clearTimeout(timer); observer.disconnect(); };
  }, [locale]);
  return null;
}
