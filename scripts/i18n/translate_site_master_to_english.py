import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import requests

INPUT_FILE = Path("src/i18n/languages/site-master.en.json")
DEEPL_KEY = os.getenv("DEEPL_API_KEY") or os.getenv("DEEPL_AUTH_KEY")
DEEPL_URL = os.getenv("DEEPL_API_URL", "https://api-free.deepl.com/v2/translate")

HAS_LETTERS_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿА-Яа-яЇїЄєІі]")
HAS_PLACEHOLDER_RE = re.compile(r"\{[^}]+\}|\$\{[^}]+\}|%s|%d")


def fix_mojibake(value: str) -> str:
    if not any(marker in value for marker in ("Ã", "Â", "Ð", "Ñ")):
        return value
    try:
        repaired = value.encode("latin1", errors="ignore").decode("utf-8", errors="ignore")
    except Exception:
        return value

    old_noise = sum(value.count(marker) for marker in ("Ã", "Â", "Ð", "Ñ"))
    new_noise = sum(repaired.count(marker) for marker in ("Ã", "Â", "Ð", "Ñ"))
    if repaired and new_noise < old_noise:
        return repaired
    return value


def should_translate(value: str) -> bool:
    normalized = value.strip()
    if not normalized:
        return False
    if not HAS_LETTERS_RE.search(normalized):
        return False
    if HAS_PLACEHOLDER_RE.search(normalized):
        return False
    return True


def chunks(items: List[str], size: int) -> Iterable[List[str]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def translate_batch_deepl(texts: List[str], session: requests.Session) -> List[Tuple[str, str]]:
    payload: List[Tuple[str, str]] = [("target_lang", "EN"), ("preserve_formatting", "1")]
    payload.extend(("text", text) for text in texts)

    headers = {"Authorization": f"DeepL-Auth-Key {DEEPL_KEY}"}
    response = session.post(DEEPL_URL, data=payload, headers=headers, timeout=30)
    response.raise_for_status()
    data = response.json()
    translations = data.get("translations", [])
    results: List[Tuple[str, str]] = []
    for item in translations:
        source_lang = str(item.get("detected_source_language", "")).lower()
        translated_text = str(item.get("text", "")).strip()
        results.append((source_lang, translated_text))
    return results


def translate_one_google(text: str, session: requests.Session) -> Tuple[str, str]:
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "auto",
        "tl": "en",
        "dt": "t",
        "q": text,
    }

    for attempt in range(4):
        try:
            response = session.get(url, params=params, timeout=20)
            response.raise_for_status()
            data = response.json()
            translated = "".join(part[0] for part in data[0] if part and part[0]).strip()
            source_lang = str(data[2] if len(data) > 2 else "").lower()
            if translated:
                return source_lang, translated
            return source_lang, text
        except Exception:
            if attempt == 3:
                return "", text
            time.sleep(0.7 * (attempt + 1))
    return "", text


def main() -> None:
    if not INPUT_FILE.exists():
        raise FileNotFoundError(f"Missing file: {INPUT_FILE}")

    with INPUT_FILE.open("r", encoding="utf-8") as fh:
        data: Dict[str, str] = json.load(fh)

    originals = list(data.values())
    fixed_by_original = {value: fix_mojibake(value) for value in set(originals)}
    candidates = sorted({value for value in fixed_by_original.values() if should_translate(value)})

    translation_cache: Dict[str, Tuple[str, str]] = {}

    if DEEPL_KEY:
        with requests.Session() as session:
            for batch in chunks(candidates, 40):
                for attempt in range(4):
                    try:
                        translated = translate_batch_deepl(batch, session)
                        if len(translated) != len(batch):
                            raise RuntimeError("DeepL returned mismatched batch size")
                        for source_text, (source_lang, translated_text) in zip(batch, translated):
                            translation_cache[source_text] = (source_lang, translated_text or source_text)
                        break
                    except Exception:
                        if attempt == 3:
                            for source_text in batch:
                                translation_cache[source_text] = ("", source_text)
                        else:
                            time.sleep(1.0 * (attempt + 1))
    else:
        with requests.Session() as session:
            with ThreadPoolExecutor(max_workers=8) as pool:
                futures = {pool.submit(translate_one_google, text, session): text for text in candidates}
                for future in as_completed(futures):
                    source_text = futures[future]
                    source_lang, translated_text = future.result()
                    translation_cache[source_text] = (source_lang, translated_text or source_text)

    translated_count = 0
    detected_non_en = 0
    output: Dict[str, str] = {}

    for key, original_value in data.items():
        fixed_value = fixed_by_original.get(original_value, original_value)
        if not should_translate(fixed_value):
            output[key] = fixed_value
            continue

        source_lang, translated_value = translation_cache.get(fixed_value, ("", fixed_value))
        source_lang = (source_lang or "").lower()
        is_non_en = bool(source_lang) and not source_lang.startswith("en")

        if is_non_en:
            output[key] = translated_value
            detected_non_en += 1
            if translated_value != original_value:
                translated_count += 1
        else:
            output[key] = fixed_value

    with INPUT_FILE.open("w", encoding="utf-8") as fh:
        json.dump(output, fh, ensure_ascii=False, indent=2)
        fh.write("\n")

    provider = "DeepL" if DEEPL_KEY else "Google fallback (no DeepL key found)"
    print(f"Provider: {provider}")
    print(f"Updated file: {INPUT_FILE}")
    print(f"Entries: {len(output)}")
    print(f"Detected non-EN entries: {detected_non_en}")
    print(f"Values changed: {translated_count}")


if __name__ == "__main__":
    main()
