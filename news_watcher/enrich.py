"""Gemini enrichment: bilingual titles/summaries, category, relevance score, slug.

Calls the same model family the site uses (gemini-3.8-flash) via the REST API.
Batched (8 items per call) with retry/backoff; a plain fallback keeps the pipeline
alive when the model is unavailable (original title + snippet, guessed category).
"""
from __future__ import annotations

import json
import os
import re
import time
from typing import Any

import requests

MODEL = os.environ.get('VEX_GEMINI_MODEL', 'gemini-3.8-flash')
API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
TIMEOUT = 60
BATCH_SIZE = 8

CATEGORIES = {
    'football': {'ar': 'كرة قدم', 'en': 'Football'},
    'basketball': {'ar': 'كرة سلة', 'en': 'Basketball'},
    'tennis': {'ar': 'تنس', 'en': 'Tennis'},
    'motorsport': {'ar': 'سباقات', 'en': 'Motorsport'},
    'combat': {'ar': 'ملاكمة وفنون قتالية', 'en': 'Boxing & MMA'},
    'cricket': {'ar': 'كريكت', 'en': 'Cricket'},
    'rugby': {'ar': 'رغبي', 'en': 'Rugby'},
    'volleyball': {'ar': 'كرة طائرة', 'en': 'Volleyball'},
    'athletics': {'ar': 'ألعاب القوى', 'en': 'Athletics'},
    'golf': {'ar': 'غولف', 'en': 'Golf'},
    'other': {'ar': 'رياضات أخرى', 'en': 'Other Sports'},
}

_KW_MAP = [
    ('football', r'football|soccer|كرة القدم|كرة قدم|دوري|-league|la liga|serie a|premier league|champions league|transfer|مباراة|جول[هة]'),
    ('basketball', r'basketball|nba|كرة السلة|نبا[كا]'),
    ('tennis', r'tennis|atp|wta|جراند سلام|ريكاردلي|تسشر?ط|فيمبلدون|رولان جاروس'),
    ('motorsport', r'f1|formula|فورمولا|سباق|ferrari|mercedes|ماكس فيرستابن|nascar|rally|رالي'),
    ('combat', r'boxing|ufc|mma|ملاكمة|بلاكي|تايسون|فيري|أوجوكو|ناشفد'),
    ('cricket', r'cricket|كريكت|آي بي إل|ipl'),
    ('rugby', r'rugby|رغبي|ستاد فرانس'),
    ('volleyball', r'volleyball|كرة الطائرة|الطائرة'),
    ('athletics', r'athletics|ألعاب القوى|ماراثون|دوري الماسة|diamond league'),
    ('golf', r'golf|غولف|ماسترز|بطولة مفتوحة'),
]


_AD_RE = re.compile(
    r'\b(bonus|promo\s*code|free\s*bet|casino|jackpot\s*winner|download\s*the\s*app|sponsored|advert'
    r'|betting\s+sites?|betting\s+guide|sports\s*betting|sportsbook|where\s+to\s+bet|best\s+\S+\s+sites'
    r'|quiz|quizzes|gallery|photo\s+essay)\b'
    r'|كازينو|كود خصم|لعبة الروليت|إعلان ممول|عرض ترويجي|التخمين|مسابقة|معرض صور',
    re.IGNORECASE,
)

# Clearly-not-sports news (war, politics, weather, health, flights...) that slips
# through general-interest feeds. Only used as a fallback when the AI is offline.
_NONSPORT_RE = re.compile(
    r'\b(war|military|minister|government|election|parliament|museum|flight[sd]?\b|airport'
    r'|earthquake|storm\b|flood|virus|vaccine|refugee|court\s+ruling|inflation|strike[sd]?\b'
    r'|obituary|funeral)\b'
    r'|حرب|قتلى|هجوم|انفجار|متحف|رحلات جوية|مطار|رئيس الوزراء|الحكومة|وزارة|انتخابات|برلمان'
    r'|زلزال|عاصفة|فيروس|لقاح|إضراب|جنازة|نصائح صحية|نزلات البرد|علاج',
    re.IGNORECASE,
)

_MIN_WORDS = 3   # titles shorter than this (e.g. "Photos") are nav/page junk

_AR_RE = re.compile(r'[\u0600-\u06FF]')


def has_arabic(text: str) -> bool:
    """True when the text contains Arabic script (publishable without translation)."""
    return bool(_AR_RE.search(text or ''))


def probe(api_key: str, log) -> bool:
    """One tiny Gemini call per cycle: True -> bilingual mode (ar+en),
    False -> arabic-only mode (English items wait for a later cycle)."""
    global _COOLDOWN_UNTIL
    if not api_key:
        log('[probe] no gemini api key -> arabic-only mode')
        return False
    url = f'{API_BASE}/{MODEL}:generateContent?key={api_key}'
    body = {
        'contents': [{'parts': [{'text': 'Reply with exactly: OK'}]}],
        'generationConfig': {'temperature': 0, 'maxOutputTokens': 8},
    }
    try:
        r = requests.post(url, json=body, timeout=20)
        if r.status_code == 200 and r.json().get('candidates'):
            _COOLDOWN_UNTIL = 0.0
            log('[probe] gemini OK -> bilingual mode (ar+en)')
            return True
        log(f'[probe] gemini down (HTTP {r.status_code}) -> arabic-only mode')
    except Exception as e:  # noqa: BLE001
        log(f'[probe] gemini down ({str(e)[:120]}) -> arabic-only mode')
    return False


def guess_category_key(text: str) -> str:
    low = (text or '').lower()
    for key, pat in _KW_MAP:
        if re.search(pat, low):
            return key
    return 'other'


def load_api_key() -> str:
    if os.environ.get('GEMINI_API_KEY'):
        return os.environ['GEMINI_API_KEY']
    for env_path in (
        os.path.join(os.environ.get('VEX_ROOT', ''), '.env'),
        '/opt/vex1/.env',
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'),
    ):
        if not env_path or not os.path.isfile(env_path):
            continue
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('GEMINI_API_KEY='):
                        return line.split('=', 1)[1].strip().strip('"').strip("'")
        except OSError:
            continue
    return ''


def _gemini_json(api_key: str, payload_text: str, log) -> Any:
    url = f'{API_BASE}/{MODEL}:generateContent?key={api_key}'
    body = {
        'contents': [{'parts': [{'text': payload_text}]}],
        'generationConfig': {
            'temperature': 0.3,
            'maxOutputTokens': 8192,
            'responseMimeType': 'application/json',
        },
    }
    last_err: Exception | None = None
    for attempt, wait in enumerate((3, 8, 20, 45, 90)):
        try:
            r = requests.post(url, json=body, timeout=TIMEOUT)
            if r.status_code == 429 or r.status_code >= 500:
                raise RuntimeError(f'HTTP {r.status_code}: {r.text[:200]}')
            r.raise_for_status()
            data = r.json()
            text = data['candidates'][0]['content']['parts'][0]['text']
            return json.loads(text)
        except Exception as e:  # noqa: BLE001 — any failure -> backoff retry
            last_err = e
            if attempt >= 4:
                break
            log(f'[enrich] gemini attempt {attempt + 1} failed: {str(e)[:160]}; retry in {wait}s')
            time.sleep(wait)
    raise RuntimeError(f'gemini failed after retries: {last_err}')


def _build_prompt(batch: list[dict]) -> str:
    items = []
    for i, c in enumerate(batch):
        items.append({
            'i': i,
            'source_name': c.get('source', ''),
            'headline': c.get('title', ''),
            'snippet': (c.get('snippet') or '')[:600],
            'article_text': (c.get('body_text') or '')[:1600],
            'url': c.get('url', ''),
        })
    cats = ', '.join(f'"{k}"' for k in CATEGORIES)
    return f"""You are the news editor of a multilingual sports portal. Process the items below.

For EACH item produce STRICT JSON with exactly these keys:
- "i": the input index
- "is_sports": boolean — true only if it is real sports news (any sport, any league, any country). False for ads, betting promos, politics, entertainment gossip, opinion spam.
- "score": integer 0-100 — editorial relevance for a general sports audience. Real, concrete sports news = 70-95. Big story (transfer, tournament, injury of a star) = 85-100. Non-sports or promo = 0-30.
- "category_key": one of [{cats}]
- "title_ar": vivid Arabic headline, max 120 chars
- "title_en": vivid English headline, max 120 chars
- "summary_ar": 1-2 sentence Arabic summary (factual, no hype, max 280 chars)
- "summary_en": 1-2 sentence English summary (max 280 chars)
- "body_ar": array of exactly 2 short Arabic paragraphs (each 30-70 words, original wording, facts only)
- "body_en": array of exactly 2 short English paragraphs
- "slug": lowercase ASCII kebab-case slug from the ENGLISH headline, max 60 chars, letters/digits/hyphens only (no stopwords like the-a-of)
- "story_key": lowercase ASCII kebab-case identity of THE EVENT described (subject + what happened, e.g. "haaland-injury-manchester-city-oct-2026"), max 80 chars. Items about the SAME real-world event — even from different sources or languages — MUST produce the identical story_key. Different events get different keys.

Rules:
- Translate/summarize from the provided headline/snippet/article_text — never invent facts, scores, quotes or dates that are not present.
- If the item is not sports, still return all keys, set is_sports=false and score<=25.
- Output a single JSON array, no markdown, no commentary.

Items:
{json.dumps(items, ensure_ascii=False)}"""


# When Gemini fails with quota/demand errors we stop hammering it for a while.
_COOLDOWN_UNTIL = 0.0
_COOLDOWN_FAIL = 900.0   # after a failed batch, wait 15 min before trying Gemini again


def enrich_batch(batch: list[dict], api_key: str, log, ai_ok: bool = True) -> list[dict]:
    """Returns enriched items aligned with `batch` (fallback fills whatever is missing).
    ai_ok comes from probe() every cycle; when False no API call is made at all."""
    global _COOLDOWN_UNTIL
    results: dict[int, dict] = {}
    if api_key and batch and ai_ok:
        now = time.time()
        if now < _COOLDOWN_UNTIL:
            log(f'[enrich] gemini failed earlier this cycle; fallback for {len(batch)} items')
        else:
            try:
                raw = _gemini_json(api_key, _build_prompt(batch), log)
                if isinstance(raw, dict):
                    raw = raw.get('items') or raw.get('results') or []
                for entry in raw if isinstance(raw, list) else []:
                    i = entry.get('i')
                    if isinstance(i, int) and 0 <= i < len(batch):
                        results[i] = entry
                if results:
                    _COOLDOWN_UNTIL = 0.0
            except Exception as e:  # noqa: BLE001
                _COOLDOWN_UNTIL = time.time() + _COOLDOWN_FAIL
                log(f'[enrich] gemini batch failed, fallback for {len(batch)} items '
                    f'(rest of cycle is arabic-only): {e}')

    out: list[dict] = []
    for i, cand in enumerate(batch):
        entry = results.get(i) or {}
        ai_used = bool(entry)
        cat = entry.get('category_key') if entry.get('category_key') in CATEGORIES else guess_category_key(
            f"{cand.get('title', '')} {cand.get('snippet', '')}"
        )
        hold = False
        if ai_used:
            is_sports = entry.get('is_sports')
            if is_sports is None:
                is_sports = cat != 'other' or bool(
                    re.search(r'sport|رياضة|كرة', f"{cand.get('title', '')} {cand.get('snippet', '')}", re.I)
                )
            try:
                score = int(entry.get('score'))
            except (TypeError, ValueError):
                score = 60 if is_sports else 20
        else:
            # AI unavailable this cycle: quality-gate first, then arabic-only rule —
            # non-Arabic stories are held (not remembered) until a later cycle
            # when gemini is back and can translate them to ar+en.
            text = f"{cand.get('title', '')} {cand.get('snippet', '')}"
            words = re.findall(r'\S+', cand.get('title', ''))
            if _AD_RE.search(text):
                is_sports, score = False, 10
            elif len(words) < _MIN_WORDS and len(cand.get('title', '')) < 30:
                is_sports, score = False, 5   # page/nav junk
            elif guess_category_key(text) == 'other' and _NONSPORT_RE.search(text):
                is_sports, score = False, 15  # general-news leak from a mixed feed
            elif not has_arabic(text):
                hold = True
                is_sports, score = False, 0   # english story, gemini down -> wait
            else:
                is_sports, score = True, 65
        title_en = (entry.get('title_en') or '').strip() or cand.get('title', '')
        title_ar = (entry.get('title_ar') or '').strip() or cand.get('title', '')
        out.append({
            **cand,
            'hold_lang': hold,
            'is_sports': bool(is_sports),
            'score': max(0, min(100, score)),
            'category_key': cat,
            'category_ar': CATEGORIES[cat]['ar'],
            'category_en': CATEGORIES[cat]['en'],
            'title_ar': title_ar[:160],
            'title_en': title_en[:160],
            'summary_ar': (entry.get('summary_ar') or cand.get('snippet') or '')[:300],
            'summary_en': (entry.get('summary_en') or cand.get('snippet') or '')[:300],
            'body_ar': entry.get('body_ar') if isinstance(entry.get('body_ar'), list) else [],
            'body_en': entry.get('body_en') if isinstance(entry.get('body_en'), list) else [],
            'slug_src': (entry.get('slug') or '').strip(),
            'story_key': (entry.get('story_key') or '').strip().lower()[:100],
        })
    return out
