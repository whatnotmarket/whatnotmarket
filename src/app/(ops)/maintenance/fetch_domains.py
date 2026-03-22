#!/usr/bin/env python3
"""Fetch disposable domains and sync maintenance blocklists."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Iterable, Set
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_DIR = Path(__file__).resolve().parent
BLOCKLIST_FILE = BASE_DIR / "disposable_email_blocklist.conf"
ALLOWLIST_FILE = BASE_DIR / "allowlist.conf"
EMAIL_PATTERN_FILE = BASE_DIR / "email_pattern_blocklist.conf"
PUBLIC_SUFFIX_LOCAL_FILE = BASE_DIR / "publicsuffixlist.local"
PUBLIC_SUFFIX_URL = "https://publicsuffix.org/list/public_suffix_list.dat"
TIMEOUT_SECONDS = 30
USER_AGENT = "OpenlyMaintenanceDomainFetcher/1.0"

DOMAIN_PATTERN = re.compile(
    r"@([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,})",
    re.IGNORECASE,
)

DEFAULT_EMAIL_PATTERNS = {
    r"^(?:test|fake|spam|temp|trash|disposable|mailinator|noreply|no-reply)(?:[._+-]?\d*)@",
    r"^[a-z]{1,2}\d{6,}@",
    r"^\d{8,}@",
    r"^[^@]{0,64}[._+-]{3,}[^@]*@",
}


def load_conf_set(path: Path, lowercase: bool = True) -> Set[str]:
    if not path.exists():
        return set()
    lines = path.read_text(encoding="utf-8").splitlines()
    values: Set[str] = set()
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if lowercase:
            line = line.lower()
        values.add(line)
    return values


def write_conf_sorted(path: Path, values: Iterable[str]) -> None:
    normalized = sorted({v.strip().lower() for v in values if v.strip()}, key=lambda s: s.lower())
    path.write_text("\n".join(normalized) + ("\n" if normalized else ""), encoding="utf-8")


def request_text(url: str, method: str = "GET", form_data: dict[str, str] | None = None) -> str:
    body = None
    headers = {"User-Agent": USER_AGENT}
    if form_data is not None:
        body = urlencode(form_data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    request = Request(url=url, method=method, headers=headers, data=body)
    with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return response.read().decode("utf-8", errors="replace")


def request_json(url: str, method: str = "GET", form_data: dict[str, str] | None = None):
    raw = request_text(url=url, method=method, form_data=form_data)
    return json.loads(raw)


def normalize_domain(domain: str) -> str:
    candidate = domain.strip().lower().replace("@", "").strip(".")
    if not candidate or len(candidate) > 253:
        return ""

    if "." not in candidate:
        return ""

    labels = candidate.split(".")
    for label in labels:
        if not label or len(label) > 63:
            return ""
        if label.startswith("-") or label.endswith("-"):
            return ""
        if not re.fullmatch(r"[a-z0-9-]+", label):
            return ""

    return candidate


def extract_domains_from_text(text: str) -> Set[str]:
    domains: Set[str] = set()

    for match in DOMAIN_PATTERN.findall(text):
        normalized = normalize_domain(match)
        if normalized:
            domains.add(normalized)

    for line in text.splitlines():
        if "@" not in line:
            continue
        for part in line.split("@")[1:]:
            maybe = part.strip().split()[0].strip(">,;)'\"")
            normalized = normalize_domain(maybe)
            if normalized:
                domains.add(normalized)

    return domains


def load_public_suffixes() -> Set[str]:
    suffixes: Set[str] = set()

    if PUBLIC_SUFFIX_LOCAL_FILE.exists():
        for line in PUBLIC_SUFFIX_LOCAL_FILE.read_text(encoding="utf-8").splitlines():
            cleaned = line.strip().lower()
            if cleaned and not cleaned.startswith("#"):
                suffixes.add(cleaned)

    try:
        content = request_text(PUBLIC_SUFFIX_URL)
        for line in content.splitlines():
            cleaned = line.strip().lower()
            if not cleaned or cleaned.startswith("//"):
                continue
            if cleaned.startswith("!") or "*" in cleaned:
                continue
            suffixes.add(cleaned)
    except (URLError, TimeoutError, OSError) as error:
        print(f"Warning: unable to fetch public suffix list: {error}", file=sys.stderr)

    return suffixes


def registrable_domain(domain: str, suffixes: Set[str]) -> str:
    labels = domain.split(".")
    if len(labels) < 2:
        return ""

    best_index = -1
    best_len = -1

    for i in range(len(labels)):
        suffix = ".".join(labels[i:])
        if suffix in suffixes:
            suffix_len = len(labels) - i
            if suffix_len > best_len:
                best_len = suffix_len
                best_index = i

    if best_index == 0:
        return ""

    if best_index > 0:
        return f"{labels[best_index - 1]}.{'.'.join(labels[best_index:])}"

    return ".".join(labels[-2:])


def keep_registrable_domains(domains: Set[str], suffixes: Set[str]) -> Set[str]:
    filtered: Set[str] = set()
    for domain in domains:
        registered = registrable_domain(domain, suffixes)
        if registered and registered == domain and domain not in suffixes:
            filtered.add(domain)
    return filtered


class DomainFetcher:
    def __init__(self, name: str):
        self.name = name

    def fetch(self) -> Set[str]:
        raise NotImplementedError


class YopmailFetcher(DomainFetcher):
    def __init__(self):
        super().__init__("Yopmail")
        self.url = "https://yopmail.com/en/domain?d=list"

    def fetch(self) -> Set[str]:
        text = request_text(self.url)
        return extract_domains_from_text(text)


class TmailFetcher(DomainFetcher):
    def __init__(self):
        super().__init__("Tmail")
        self.url = "http://45.207.211.187:1234/api/domains"

    def fetch(self) -> Set[str]:
        payload = request_json(self.url)
        domains: Set[str] = set()
        for item in payload.get("data", {}).get("domains", []):
            if isinstance(item, str):
                normalized = normalize_domain(item)
                if normalized:
                    domains.add(normalized)
        return domains


class YoursToolsFetcher(DomainFetcher):
    def __init__(self):
        super().__init__("YoursTools")
        self.url = "https://apis.kyfudao.com/apis.php"

    def fetch(self) -> Set[str]:
        payload = request_json(self.url, method="POST", form_data={"ajax": "get_domains"})
        domains: Set[str] = set()
        for item in payload.get("domains", []):
            if isinstance(item, str):
                normalized = normalize_domain(item)
                if normalized:
                    domains.add(normalized)
        return domains


class NoopmailFetcher(DomainFetcher):
    def __init__(self):
        super().__init__("Noopmail")
        self.url = "http://103.166.182.97:8080/api/d"

    def fetch(self) -> Set[str]:
        payload = request_json(self.url)
        domains: Set[str] = set()
        if isinstance(payload, list):
            for item in payload:
                if isinstance(item, str):
                    normalized = normalize_domain(item)
                    if normalized:
                        domains.add(normalized)
        return domains


FETCHERS = [
    YopmailFetcher(),
    TmailFetcher(),
    NoopmailFetcher(),
    YoursToolsFetcher(),
]


def update_blocklist(new_domains: Set[str], source_name: str, allowlist: Set[str]) -> int:
    existing = load_conf_set(BLOCKLIST_FILE)
    candidate_domains = {d for d in new_domains if d not in allowlist}
    missing = candidate_domains - existing

    if not missing:
        print(f"No new domains to add from {source_name}.")
        return 0

    print(f"Found {len(missing)} new domains from {source_name}:")
    for domain in sorted(missing):
        print(f"  + {domain}")

    write_conf_sorted(BLOCKLIST_FILE, existing | missing)
    return len(missing)


def sync_email_pattern_rules() -> int:
    existing = load_conf_set(EMAIL_PATTERN_FILE, lowercase=False)
    missing = DEFAULT_EMAIL_PATTERNS - existing
    if not missing:
        print("Email pattern rules already up to date.")
        return 0

    print(f"Added {len(missing)} missing email pattern rule(s).")
    write_conf_sorted(EMAIL_PATTERN_FILE, existing | DEFAULT_EMAIL_PATTERNS)
    return len(missing)


def main() -> int:
    suffixes = load_public_suffixes()
    allowlist = load_conf_set(ALLOWLIST_FILE)

    total_added = 0
    processed_sources = 0

    for fetcher in FETCHERS:
        print(f"\n=== Fetching domains from {fetcher.name} ===")
        try:
            raw_domains = fetcher.fetch()
            if not raw_domains:
                print(f"No domains found from {fetcher.name}.")
                continue

            if suffixes:
                domains = keep_registrable_domains(raw_domains, suffixes)
            else:
                domains = raw_domains

            print(f"Valid domains found from {fetcher.name}: {len(domains)}")
            added = update_blocklist(domains, fetcher.name, allowlist)
            total_added += added
            processed_sources += 1
        except Exception as error:  # noqa: BLE001
            print(f"Error processing {fetcher.name}: {error}", file=sys.stderr)

    added_patterns = sync_email_pattern_rules()

    print("\n=== Summary ===")
    print(f"Processed source(s): {processed_sources}")
    print(f"New disposable domains added: {total_added}")
    print(f"New email pattern rules added: {added_patterns}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
