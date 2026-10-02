"""Source registry. First run writes data/news_sources.json from these defaults;
edit that file to add/remove sources without touching code."""
from __future__ import annotations

import json
import os
import time

DEFAULT_SOURCES = [
    # ---------- RSS: English ----------
    {"id": "bbc-sport", "name": "BBC Sport", "type": "rss", "lang": "en", "enabled": True,
     "feed": "https://feeds.bbci.co.uk/sport/rss.xml", "max_items": 25},
    {"id": "espn", "name": "ESPN", "type": "rss", "lang": "en", "enabled": True,
     "feed": "https://www.espn.com/espn/rss/news", "max_items": 25},
    {"id": "guardian-sport", "name": "The Guardian Sport", "type": "rss", "lang": "en", "enabled": True,
     "feed": "https://www.theguardian.com/sport/rss", "max_items": 25},
    {"id": "sky-football", "name": "Sky Sports Football", "type": "rss", "lang": "en", "enabled": True,
     "feed": "https://www.skysports.com/rss/12040", "max_items": 25},
    {"id": "france24-sports", "name": "France 24 Sports", "type": "rss", "lang": "en", "enabled": True,
     "feed": "https://www.france24.com/en/sports/rss", "max_items": 20},
    {"id": "si", "name": "Sports Illustrated", "type": "rss", "lang": "en", "enabled": False,
     "feed": "https://www.si.com/rss/si_topstories.rss", "max_items": 20},
    {"id": "cbssports", "name": "CBS Sports", "type": "rss", "lang": "en", "enabled": True,
     "feed": "https://www.cbssports.com/rss/headlines/", "max_items": 20},
    {"id": "espncricinfo", "name": "ESPNcricinfo", "type": "rss", "lang": "en", "enabled": True,
     "feed": "https://www.espncricinfo.com/rss/content", "max_items": 20},
    {"id": "motorsport", "name": "Motorsport.com", "type": "rss", "lang": "en", "enabled": False,
     "feed": "https://www.motorsport.com/rss/news/", "max_items": 20},
    {"id": "lequipe-football", "name": "L'Équipe Football", "type": "rss", "lang": "fr", "enabled": True,
     "feed": "https://www.lequipe.fr/rss/actu_rss_Football.xml", "max_items": 20},
    {"id": "kicker", "name": "kicker", "type": "rss", "lang": "de", "enabled": True,
     "feed": "https://www.kicker.de/news/rss", "max_items": 20},

    # ---------- RSS: Arabic ----------
    {"id": "bbc-arabic-sport", "name": "بي بي سي عربي - رياضة", "type": "rss", "lang": "ar", "enabled": False,
     "feed": "https://feeds.bbci.co.uk/arabic/sport/rss.xml", "max_items": 20},
    {"id": "kingfut", "name": "كينج فوت", "type": "rss", "lang": "ar", "enabled": True,
     "feed": "https://www.kingfut.com/feed/", "max_items": 20},

    # ---------- HTML listings (requests + selectors) ----------
    {"id": "yallakora", "name": "يلا كورة", "type": "html", "lang": "ar", "enabled": True,
     "list_url": "https://www.yallakora.com/",
     "link_regex": "href=\"([^\"]*news-details[^\"]*)\"", "max_items": 20},
    {"id": "filgoal", "name": "في الجول", "type": "html", "lang": "ar", "enabled": True,
     "list_url": "https://www.filgoal.com/",
     "link_regex": "href=\"([^\"]*(?:/articles/|/news/)[^\"]*)\"", "max_items": 20},
    {"id": "givemesport", "name": "GiveMeSport", "type": "html", "lang": "en", "enabled": True,
     "list_url": "https://www.givemesport.com/",
     "item_selector": "a[href*='/news/']", "min_title_len": 25, "max_items": 20},
    {"id": "fourfourtwo", "name": "FourFourTwo", "type": "html", "lang": "en", "enabled": True,
     "list_url": "https://www.fourfourtwo.com/",
     "item_selector": "a[href*='/news/']", "min_title_len": 25, "max_items": 20},

    # ---------- JS-heavy / notifications (Playwright Chromium) ----------
    {"id": "goal-ar", "name": "Goal العربية", "type": "browser", "lang": "ar", "enabled": True,
     "list_url": "https://www.goal.com/ar",
     "item_selector": "a[href*='/news/']", "min_title_len": 20, "max_items": 20},
    {"id": "kooora", "name": "كووورة", "type": "browser", "lang": "ar", "enabled": True,
     "list_url": "https://www.kooora.com/",
     "link_regex": "href=\"([^\"]*(?:/news/|/article)[^\"]*)\"", "max_items": 20},
    {"id": "marca", "name": "Marca", "type": "browser", "lang": "es", "enabled": True,
     "list_url": "https://www.marca.com/",
     "item_selector": "a[href*='/futbol/'], a[href*='/motor/']", "min_title_len": 25, "max_items": 20},
    {"id": "as", "name": "AS", "type": "browser", "lang": "es", "enabled": True,
     "list_url": "https://as.com/",
     "link_regex": "href=\"([^\"]*/noticias/[^\"]*)\"", "max_items": 20},
    {"id": "gazzetta-web", "name": "La Gazzetta dello Sport", "type": "browser", "lang": "it", "enabled": False,
     "list_url": "https://www.gazzetta.it/",
     "item_selector": "a[href*='/calcio/'], a[href*='/tennis/']", "min_title_len": 25, "max_items": 15},
    {"id": "skysportarabic", "name": "سكاي سبورت عربي", "type": "browser", "lang": "ar", "enabled": False,
     "list_url": "https://www.skysportarabic.com/",
     "link_regex": "href=\"([^\"]*(?:/football/|/news/)[^\"]*)\"", "max_items": 15},
]


def load_sources(path: str, log) -> list[dict]:
    if not os.path.isfile(path):
        os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
        tmp = path + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_SOURCES, f, ensure_ascii=False, indent=2)
        os.replace(tmp, path)
        log(f'[sources] wrote {len(DEFAULT_SOURCES)} default sources -> {path}')
        return list(DEFAULT_SOURCES)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list) and data:
            return [s for s in data if isinstance(s, dict) and s.get('id')]
        log(f'[sources] {path} invalid shape, using defaults')
        return list(DEFAULT_SOURCES)
    except (OSError, ValueError) as e:
        log(f'[sources] failed to read {path}: {e}; using defaults')
        return list(DEFAULT_SOURCES)


def source_due(src: dict, state: dict, cfg: dict, now: float) -> bool:
    st = state.get(src.get('id', ''), {})
    cooldown = float(st.get('cooldown_until', 0) or 0)
    if cooldown > now:
        return False
    last = float(st.get('last_fetch', 0) or 0)
    interval = float(src.get('min_interval_min', cfg.get('interval_min', 15))) * 60
    return (now - last) >= interval


def mark_fetched(state: dict, src_id: str, count: int, ok: bool, cfg: dict, now: float) -> None:
    st = state.setdefault(src_id, {})
    st['last_fetch'] = now
    st['last_count'] = count
    if ok:
        st['errors'] = 0
        st['cooldown_until'] = 0
    else:
        st['errors'] = int(st.get('errors', 0)) + 1
        if st['errors'] >= int(cfg.get('max_consecutive_errors', 8)):
            st['cooldown_until'] = now + 6 * 3600  # back off hard for 6h, then retry
            st['errors'] = 0
