"""Layered duplicate detection — every story is published at most once.

Layers:
  1. URL normalization  (tracking params / mobile mirrors / fragments)
  2. Title fingerprint  (diacritics+alef normalization, stopwords, sorted tokens -> sha1)
  3. Fuzzy match        (token overlap + SequenceMatcher >= 0.85)
  4. Persistent history (data/news_history.json, 30-day window for fuzzy)
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
import unicodedata
from difflib import SequenceMatcher
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit, unquote

TRACKING_PARAMS = {
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'yclid', 'msclkid', 'mc_cid', 'mc_eid', 'igshid',
    'igsh', 'ref', 'referrer', 'ref_src', 'share', 'share_source', 'from',
    's', 'cmpid', 'ito', 'icid', 'ns_campaign', 'ns_mchannel', 'ns_source',
    'output', 'amp', '_ga', '_gl', 'trk', 'src', 'source',
}

SHORTENER_HOSTS = {
    'bit.ly', 't.co', 'goo.gl', 'tinyurl.com', 'ow.ly', 'is.gd', 'buff.ly',
    'cutt.ly', 'rebrand.ly', 'rb.gy', 't.me', 'whatsapp.com', 'wa.me',
}

ARABIC_DIACRITICS = re.compile(r'[\u0610-\u061A\u064B-\u065F\u0670\u0640\u06D6-\u06ED]')

STOPWORDS = {
    # English
    'the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with',
    'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have',
    'had', 'will', 'would', 'can', 'could', 'as', 'from', 'that', 'this',
    'it', 'its', 'into', 'after', 'before', 'over', 'under', 'about',
    # Arabic (normalized)
    'في', 'من', 'على', 'عن', 'الي', 'الى', 'إلى', 'أن', 'ان', 'مع', 'بعد',
    'قبل', 'بين', 'عند', 'حتي', 'حتى', 'كما', 'اذا', 'إذا', 'قد', 'كل',
    'له', 'لها', 'هم', 'هن', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'كان',
    'كانت', 'يكون', 'تكون', 'ولا', 'بل', 'و', 'ف', 'ب', 'ل', 'اخبار', 'خبر',
}

WORD_RE = re.compile(r'[\w\u0600-\u06FF]{2,}', re.UNICODE)


def normalize_url(url: str) -> str:
    """Canonical form of a URL so share/mobile/tracking variants collapse to one key."""
    if not url:
        return ''
    try:
        url = unquote(url.strip())
        parts = urlsplit(url)
    except ValueError:
        return url.strip().lower()

    scheme = 'https'
    host = (parts.hostname or '').lower()
    if host.startswith('www.'):
        host = host[4:]
    if host.startswith('m.') and len(host) > 3:
        host = host[2:]
    if host.startswith('mobile.'):
        host = host[7:]
    if host.endswith('.mobi'):
        host = host[:-5]
    if not host:
        return url.strip().lower()

    path = parts.path or '/'
    if path.endswith('/amp/') or path.endswith('/amp'):
        path = path[:-4].rstrip('/') or '/'
    path = re.sub(r'/+', '/', path)
    if len(path) > 1:
        path = path.rstrip('/')

    kept = []
    for k, v in parse_qsl(parts.query, keep_blank_values=True):
        lk = k.lower()
        if lk in TRACKING_PARAMS or lk.startswith('utm_') or lk.startswith('matomo'):
            continue
        if lk == 'output' and v.lower() in ('amp', 'embed'):
            continue
        kept.append((k, v))
    query = urlencode(kept, doseq=True)

    return urlunsplit((scheme, host, path, query, ''))


def is_shortener(url: str) -> bool:
    try:
        host = (urlsplit(url).hostname or '').lower()
    except ValueError:
        return False
    return host.removeprefix('www.') in SHORTENER_HOSTS


def normalize_title(title: str) -> str:
    """Lowercased, diacritics-stripped, alef/ya normalized, stopword-free sorted tokens."""
    s = unicodedata.normalize('NFKC', title or '').lower()
    s = ARABIC_DIACRITICS.sub('', s)
    s = s.replace('\u0622', '\u0627').replace('\u0623', '\u0627').replace('\u0625', '\u0627')
    s = s.replace('\u0649', '\u064a')
    s = re.sub(r'[^\w\s\u0600-\u06FF]+', ' ', s, flags=re.UNICODE)
    toks = [t for t in WORD_RE.findall(s) if t not in STOPWORDS]
    return ' '.join(sorted(toks))


def title_fingerprint(title: str) -> str:
    return hashlib.sha1(normalize_title(title).encode('utf-8')).hexdigest()[:20]


def _tokens(norm_title: str) -> set[str]:
    return set(norm_title.split()) if norm_title else set()


def similarity(a_norm: str, b_norm: str) -> float:
    """0..1 similarity between two normalized titles (fast token check first)."""
    ta, tb = _tokens(a_norm), _tokens(b_norm)
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    union = len(ta | tb)
    if inter == 0:
        return 0.0
    jaccard = inter / union
    if jaccard >= 0.9:
        return 0.95
    if jaccard < 0.35:
        return 0.0
    return SequenceMatcher(None, a_norm, b_norm).ratio()


DUP_THRESHOLD = 0.85


class NewsHistory:
    """Persistent store of every URL + title fingerprint we have ever seen."""

    def __init__(self, path: str):
        self.path = path
        self.urls: dict[str, float] = {}
        self.fps: dict[str, dict] = {}       # fp -> {"t": epoch, "s": norm_title, "r": rejected?}
        self.story_keys: dict[str, float] = {}  # AI event keys -> epoch
        self._index: dict[str, set[str]] = {}
        self.load()

    def load(self) -> None:
        try:
            with open(self.path, 'r', encoding='utf-8') as f:
                raw = json.load(f)
            self.urls = {k: float(v) for k, v in (raw.get('urls') or {}).items()}
            self.fps = {k: v for k, v in (raw.get('fps') or {}).items() if isinstance(v, dict)}
            self.story_keys = {k: float(v) for k, v in (raw.get('storyKeys') or {}).items()}
        except (OSError, ValueError):
            self.urls, self.fps, self.story_keys = {}, {}, {}
        self._rebuild_index()
        self._prune()

    def _rebuild_index(self) -> None:
        self._index = {}
        for fp, meta in self.fps.items():
            for t in (meta.get('s') or '').split():
                self._index.setdefault(t, set()).add(fp)

    def _prune(self, max_age_days: int = 30, max_entries: int = 50000, max_urls: int = 150000) -> None:
        cutoff = time.time() - max_age_days * 86400
        self.urls = {k: v for k, v in self.urls.items() if v >= cutoff}
        if len(self.urls) > max_urls:
            newest = sorted(self.urls.items(), key=lambda kv: -kv[1])[:max_urls]
            self.urls = dict(newest)
        self.fps = {k: v for k, v in self.fps.items() if float(v.get('t', 0)) >= cutoff}
        self.story_keys = {k: v for k, v in self.story_keys.items() if v >= cutoff}
        if len(self.fps) > max_entries:
            newest = sorted(self.fps.items(), key=lambda kv: -float(kv[1].get('t', 0)))[:max_entries]
            self.fps = dict(newest)
        self._rebuild_index()

    def story_key_seen(self, key: str) -> bool:
        """Layer 5: event-level identity assigned by the enricher (cross-language)."""
        return bool(key) and key in self.story_keys

    def remember_story_key(self, key: str) -> None:
        if key:
            self.story_keys[key] = time.time()

    def seen_url(self, url: str) -> bool:
        return normalize_url(url) in self.urls

    def remember_url(self, url: str) -> None:
        nu = normalize_url(url)
        if nu:
            self.urls[nu] = time.time()

    def duplicate_title(self, title: str) -> bool:
        """True if this title (or a near-identical one) was already seen or rejected."""
        norm = normalize_title(title)
        if not norm:
            return False
        fp = hashlib.sha1(norm.encode('utf-8')).hexdigest()[:20]
        if fp in self.fps:
            return True
        toks = list(_tokens(norm))
        if not toks:
            return False
        # rarest tokens first -> smallest posting lists
        toks.sort(key=lambda t: len(self._index.get(t, ())))
        pool: set[str] = set()
        for t in toks[:5]:
            pool |= self._index.get(t, set())
            if len(pool) > 3000:
                break
        cutoff = time.time() - 30 * 86400
        for other_fp in pool:
            meta = self.fps.get(other_fp)
            if not meta or float(meta.get('t', 0)) < cutoff:
                continue
            if similarity(norm, meta.get('s') or '') >= DUP_THRESHOLD:
                return True
        return False

    def remember_title(self, title: str, rejected: bool = False) -> None:
        norm = normalize_title(title)
        if not norm:
            return
        fp = hashlib.sha1(norm.encode('utf-8')).hexdigest()[:20]
        self.fps[fp] = {'t': time.time(), 's': norm, **({'r': 1} if rejected else {})}
        for t in _tokens(norm):
            self._index.setdefault(t, set()).add(fp)

    def save(self) -> None:
        os.makedirs(os.path.dirname(self.path) or '.', exist_ok=True)
        tmp = self.path + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump({'urls': self.urls, 'fps': self.fps, 'storyKeys': self.story_keys, 'savedAt': time.time()},
                      f, ensure_ascii=False)
        os.replace(tmp, self.path)


def slugify_en(text: str, max_len: int = 60) -> str:
    """ASCII kebab slug from an English headline (Arabic titles -> empty -> caller falls back)."""
    s = unicodedata.normalize('NFKD', text or '')
    s = s.encode('ascii', 'ignore').decode('ascii').lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:max_len].rstrip('-')
