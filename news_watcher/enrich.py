"""Enrichment: bilingual titles/summaries, category, relevance score, slug.

AI calls go through the multi-provider key ring (aiclient): Gemini native keys,
OpenRouter or any OpenAI-compatible API — a dead key cools down and the next one
takes over. When every key is cooling down a pure-rules fallback keeps the
pipeline alive (original title + snippet, guessed category, strict sports gate,
English items published as-is) so publishing never stops.
"""
from __future__ import annotations

import json
import os
import re

import aiclient

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
    r'\b(free\s*bet|betting\s+bonus|casino\s+bonus|bonus\s+(?:bet|betting|code|offer|round)'
    r'|promo\s*code|casino|jackpot\s*winner|download\s+the\s+app|sponsored|advert'
    r'|betting\s+sites?|betting\s+guide|sports\s*betting|sportsbook|where\s+to\s+bet|best\s+\S+\s+sites'
    r'|quiz|quizzes|gallery|photo\s+essay)\b'
    r'|كازينو|كود خصم|لعبة الروليت|إعلان ممول|عرض ترويجي|التخمين|مسابقة|معرض صور',
    re.IGNORECASE,
)

# Clearly-not-sports news (war, politics, weather, health, flights...) that slips
# through general-interest feeds. Only used as a fallback when the AI is offline.
_NONSPORT_RE = re.compile(
    r'\b(war|military|minister|government|election|parliament|museum'
    r'|airlines?\b|airport|\bflights?\s+to\b'
    r'|earthquake|storm\b|flood|virus|vaccine|refugee|court\s+ruling|inflation|strike[sd]?\b'
    r'|obituary|funeral)\b'
    r'|حرب|قتلى|هجوم|انفجار|متحف|رحلات جوية|مطار|رئيس الوزراء|الحكومة|وزارة|انتخابات|برلمان'
    r'|زلزال|عاصفة|فيروس|لقاح|إضراب|جنازة|نصائح صحية|نزلات البرد|علاج',
    re.IGNORECASE,
)

# Positive sports signal (English): items that land in the generic 'other' bucket
# (no sport keyword matched) may only publish when they clearly talk about sport —
# this is what stops general-interest leaks (politics/tech/celebrity) from mixed
# feeds. Arabic is handled word-by-word in _ar_signal() below because attached
# clitics (و/ال/ف prefixes) break plain regex word boundaries.
_SPORTS_SIGNAL_RE = re.compile(
    r'\b(sports?|football|soccer|basketball|tennis|cricket|rugby|golf|boxing|wrestling'
    r'|judo(?:ka)?|karate|taekwondo|sumo|chess|cycling|cyclists?|horse\s*racing|jockeys?'
    r'|formula\s*1|\bf1\b|nba|nfl|mlb|nhl|ncaa|epl|la\s*liga|serie\s*a|bundesliga'
    r'|champions?\s*league|championship|tournament|match(es|day)?\b'
    r'|players?\b|clubs?\b|teams?\b|goals?\b|goalkeepers?|strikers?|midfielders?'
    r'|scorers?|scores?|scoring|injur(?:y|ies|ied)|wins?|victor(?:y|ies)|defeats?|beats?|beaten'
    r'|managers?|coaches|captains?|stadiums?|qualifiers?|semis?|relegations?|standings?'
    r'|transfers?\b|kickoff|halftime|penalt(y|ies)|own\s*goal|hat-?trick|derby'
    r'|premier\s*league|world\s*cup|euros?\b|olympiad|olympic|grand\s*slam|grand\s*prix'
    r'|wimbledon|arc\s+de\s+triomphe|\barc\b|cheltenham|grand\s+national'
    r'|asian\s+games|commonwealth\s+games|davis\s+cup|atp\b|wta\b|open\s*championship'
    r'|highlights?|friendl(?:y|ies)|top\s+flight|versus|vs\b'
    r'|sprains?|hamstrings?|mcl|acl'
    r'|challenge\s+cup|fa\s+cup|league\s+cup'
    r'|no\.\s*\d+|game\s*\d+|week\s*\d+|\d{1,2}\s*[-\u2013]\s*\d{1,2})\b',
    re.IGNORECASE,
)

_AR_LETTER = re.compile(r'[\u0600-\u06FF]')

# Arabic signal words incl. common conjugated verbs. Prefix clitics (ال/و/ف/ب/ل/ك)
# are stripped before the boundary check; longer words come first so that e.g.
# 'مباريات' matches before 'مباراة' would strip wrongly.
_AR_SIGNAL_WORDS = sorted((
    'بطولة', 'بطولات', 'دوريات', 'دوري', 'كأس', 'الكأس', 'مباراة', 'مباريات',
    'تصفيات', 'نهائية', 'نهائي', 'دور المجموعات', 'سباق', 'سباقات', 'الدوري',
    'لاعب', 'لاعبون', 'لاعبين', 'لاعبه', 'لاعبها', 'نادي', 'أندية', 'اندية',
    'فريق', 'فريقي', 'الفريق', 'منتخب', 'منتخبات', 'المنتخب',
    'مدرب', 'مدربين', 'مهاجم', 'مهاجمين', 'حارس', 'حارس مرمى',
    'هداف', 'الهداف', 'هدافين',
    'رياضة', 'رياضية', 'رياضي', 'رياضيين', 'ملعب', 'ملاعب',
    'شباك', 'الشباك', 'مرمى', 'المرمى',
    'يفوز', 'تفوز', 'فاز', 'فازت', 'يخسر', 'تخسر', 'خسر', 'يتعادل', 'تعادل',
    'يتأهل', 'تأهل', 'يتصدر', 'تصدر', 'يقصي', 'قصى',
    'يسجل', 'أحرز', 'احرز', 'يحرز',
    'ينضم', 'انضم', 'يتعاقد', 'تعاقد', 'انتقال', 'انتقالات', 'صفقة', 'صفقات',
    'يواجه', 'مواجهات', 'مواجهته',
), key=len, reverse=True)

_AR_PREFIXES = ('وال', 'بال', 'كال', 'فال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك')


def _ar_pre_ok(pre: str) -> bool:
    s = pre
    for _ in range(3):
        hit = next((c for c in _AR_PREFIXES if s.endswith(c)), '')
        if not hit:
            break
        s = s[:-len(hit)]
    # only the char immediately before the word matters: space/punct/latin = token
    # start; an Arabic letter means the word is glued inside a longer word (استهداف)
    return not s or not _AR_LETTER.search(s[-1])


def _ar_signal(text: str) -> bool:
    for w in _AR_SIGNAL_WORDS:
        i = text.find(w)
        while i != -1:
            if _ar_pre_ok(text[max(0, i - 4):i]):
                return True
            i = text.find(w, i + 1)
    return False


def has_sports_signal(text: str) -> bool:
    """True when the text clearly talks about sport (rules-mode gate)."""
    t = text or ''
    return bool(_SPORTS_SIGNAL_RE.search(t)) or _ar_signal(t)

_MIN_WORDS = 3   # titles shorter than this (e.g. "Photos") are nav/page junk

_AR_RE = re.compile(r'[\u0600-\u06FF]')


def has_arabic(text: str) -> bool:
    """True when the text contains Arabic script (publishable without translation)."""
    return bool(_AR_RE.search(text or ''))


def probe(log) -> bool:
    """True -> AI mode (ar+en via the key ring); False -> rules-only mode.
    State-only check: no HTTP request, so probing never burns quota."""
    return aiclient.get_ring(log).probe()


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


def enrich_batch(batch: list[dict], log, ai_ok: bool = True) -> list[dict]:
    """Returns enriched items aligned with `batch` (rules fallback fills whatever is missing).
    ai_ok comes from probe() every cycle; when False no API call is made at all."""
    results: dict[int, dict] = {}
    if batch and ai_ok:
        try:
            raw = aiclient.get_ring(log).chat_json(_build_prompt(batch))
            if isinstance(raw, dict):
                raw = raw.get('items') or raw.get('results') or []
            for entry in raw if isinstance(raw, list) else []:
                i = entry.get('i')
                if isinstance(i, int) and 0 <= i < len(batch):
                    results[i] = entry
            if not results:
                log(f'[enrich] AI returned no usable entries; rules for {len(batch)} items')
        except Exception as e:  # noqa: BLE001
            log(f'[enrich] AI ring exhausted, rules-only for {len(batch)} items: {str(e)[:200]}')

    out: list[dict] = []
    for i, cand in enumerate(batch):
        entry = results.get(i) or {}
        ai_used = bool(entry)
        text = f"{cand.get('title', '')} {cand.get('snippet', '')}"
        cat = entry.get('category_key') if entry.get('category_key') in CATEGORIES else guess_category_key(text)
        if ai_used:
            is_sports = entry.get('is_sports')
            if is_sports is None:
                is_sports = cat != 'other' or bool(re.search(r'sport|رياضة|كرة', text, re.I))
            try:
                score = int(entry.get('score'))
            except (TypeError, ValueError):
                score = 60 if is_sports else 20
        else:
            # AI cooling down: pure rules. Sport-keyword buckets pass; the generic
            # 'other' bucket needs a positive sports signal and no hard non-sports
            # match (stops general-news leaks); English items publish as-is.
            words = re.findall(r'\S+', cand.get('title', ''))
            if _AD_RE.search(text):
                is_sports, score = False, 10
            elif len(words) < _MIN_WORDS and len(cand.get('title', '')) < 30:
                is_sports, score = False, 5    # page/nav junk
            elif cat == 'other' and (not has_sports_signal(text) or _NONSPORT_RE.search(text)):
                is_sports, score = False, 15   # general-news leak from a mixed feed
            else:
                is_sports, score = True, 65
        title_en = (entry.get('title_en') or '').strip() or cand.get('title', '')
        title_ar = (entry.get('title_ar') or '').strip() or cand.get('title', '')
        out.append({
            **cand,
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
