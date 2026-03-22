import { DEFAULT_LOCALE,type Locale } from "@/i18n/config";
import { createHash } from "node:crypto";

type TranslationKey = {
  namespace: string;
  entityId: string;
  sourceHash: string;
  locale: Locale;
};

type TranslationStore = {
  get(key: TranslationKey): Promise<string | null>;
  set(key: TranslationKey, value: string): Promise<void>;
};

type TranslateFn = (input: {
  text: string;
  targetLocale: Locale;
  preserveTerms: string[];
}) => Promise<string>;

class InMemoryTranslationStore implements TranslationStore {
  private readonly store = new Map<string, string>();

  private toStoreKey(key: TranslationKey) {
    return `${key.namespace}:${key.entityId}:${key.sourceHash}:${key.locale}`;
  }

  async get(key: TranslationKey) {
    return this.store.get(this.toStoreKey(key)) ?? null;
  }

  async set(key: TranslationKey, value: string) {
    this.store.set(this.toStoreKey(key), value);
  }
}

class HttpTranslationStore implements TranslationStore {
  constructor(
    private readonly endpoint: string,
    private readonly bearerToken?: string
  ) {}

  private authHeaders(): HeadersInit {
    if (!this.bearerToken) return {};
    return { Authorization: `Bearer ${this.bearerToken}` };
  }

  async get(key: TranslationKey): Promise<string | null> {
    const url = new URL(this.endpoint);
    url.searchParams.set("namespace", key.namespace);
    url.searchParams.set("entityId", key.entityId);
    url.searchParams.set("sourceHash", key.sourceHash);
    url.searchParams.set("locale", key.locale);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        ...this.authHeaders(),
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { translatedText?: string };
    return data.translatedText ?? null;
  }

  async set(key: TranslationKey, value: string): Promise<void> {
    await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.authHeaders(),
      },
      body: JSON.stringify({ ...key, translatedText: value }),
      cache: "no-store",
    });
  }
}

const inMemoryStore = new InMemoryTranslationStore();

let externalStore: HttpTranslationStore | null = null;
let externalStoreInitAttempted = false;

function getPersistentStore(): TranslationStore {
  if (!externalStoreInitAttempted) {
    externalStoreInitAttempted = true;
    const endpoint = process.env.DYNAMIC_TRANSLATION_STORE_ENDPOINT;
    const token = process.env.DYNAMIC_TRANSLATION_STORE_TOKEN;
    if (endpoint) {
      externalStore = new HttpTranslationStore(endpoint, token);
    }
  }
  return externalStore ?? inMemoryStore;
}

const runtimeCache = new Map<string, string>();

function toRuntimeCacheKey(key: TranslationKey): string {
  return `${key.namespace}:${key.entityId}:${key.sourceHash}:${key.locale}`;
}

function hashContent(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function protectTerms(text: string, terms: string[]): {
  textWithPlaceholders: string;
  restore: (value: string) => string;
} {
  if (terms.length === 0) {
    return { textWithPlaceholders: text, restore: (value) => value };
  }

  let nextText = text;
  const placeholders = new Map<string, string>();

  terms.forEach((term, index) => {
    if (!term) return;
    const placeholder = `__TERM_${index}__`;
    placeholders.set(placeholder, term);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    nextText = nextText.replace(new RegExp(escaped, "g"), placeholder);
  });

  return {
    textWithPlaceholders: nextText,
    restore: (value: string) => {
      let restored = value;
      placeholders.forEach((term, placeholder) => {
        restored = restored.replace(new RegExp(placeholder, "g"), term);
      });
      return restored;
    },
  };
}

export async function translateDynamicContent(input: {
  namespace: string;
  entityId: string;
  sourceText: string;
  targetLocale: Locale;
  preserveTerms?: string[];
  translate?: TranslateFn;
}): Promise<string> {
  const {
    namespace,
    entityId,
    sourceText,
    targetLocale,
    preserveTerms = [],
    translate,
  } = input;

  if (!sourceText.trim()) return sourceText;
  if (targetLocale === DEFAULT_LOCALE) return sourceText;

  const key: TranslationKey = {
    namespace,
    entityId,
    sourceHash: hashContent(sourceText),
    locale: targetLocale,
  };

  const runtimeCacheKey = toRuntimeCacheKey(key);
  const runtimeCached = runtimeCache.get(runtimeCacheKey);
  if (runtimeCached) return runtimeCached;

  const store = getPersistentStore();
  const persisted = await store.get(key);
  if (persisted) {
    runtimeCache.set(runtimeCacheKey, persisted);
    return persisted;
  }

  if (!translate) return sourceText;

  const { textWithPlaceholders, restore } = protectTerms(sourceText, preserveTerms);
  const translated = await translate({
    text: textWithPlaceholders,
    targetLocale,
    preserveTerms,
  });
  const safeOutput = restore(translated || sourceText);

  await store.set(key, safeOutput);
  runtimeCache.set(runtimeCacheKey, safeOutput);
  return safeOutput;
}
