#!/usr/bin/env python3
"""VEX News Engine — aggregates sports news from RSS/HTML/browser sources,
de-duplicates each story (publish-once), enriches with Gemini (ar+en) and
writes data/sports_news.json for the Express server + /news SEO pages.

Usage:
  python3 watcher.py --once                 # single full pass (cron fallback)
  python3 watcher.py --once --verbose       # ...with per-item logging
  python3 watcher.py --once --source=marca  # one source only
  python3 watcher.py --once --dry-run       # fetch+dedupe+enrich, no publish
  python3 watcher.py                        # long-running loop (systemd)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import dedupe as dd          # noqa: E402
import enrich as en          # noqa: E402
import publish as pub        # noqa: E402
from fetchers import BrowserPool, fetch_article, fetch_browser, fetch_html, fetch_rss  # noqa: E402
from sources import load_sources, mark_fetched, source_due  # noqa: E402

ROOT = Path(os.environ.get('VEX_ROOT') or Path(__file__).resolve().parent.parent)
DATA = ROOT / 'data'
NEWS_PATH = DATA / 'sports_news.json'
HISTORY_PATH = DATA / 'news_history.json'
SOURCES_PATH = DATA / 'news_sources.json'
CONFIG_PATH = DATA / 'news_config.json'
STATE_PATH = DATA / 'news_state.json'
LOCK_PATH = DATA / 'news_watcher.lock'

DEFAULT_CONFIG = {
    'enabled': True,
    'interval_min': 15,
    'min_score': 60,
    'max_per_cycle': 30,
    'browser_enabled': True,
    'max_consecutive_errors': 8,
}


def log(msg: str) -> None:
    print(f"{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} {msg}", flush=True)


def vlog(verbose: bool):
    return (lambda m: log(m)) if verbose else (lambda m: None)


def load_json(path: Path, default):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = str(path) + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False)
    os.replace(tmp, str(path))


def fetch_source(src: dict, pool_holder: list, log_) -> list[dict]:
    stype = src.get('type', 'rss')
    if stype == 'rss':
        return fetch_rss(src)
    if stype == 'html':
        return fetch_html(src)
    if stype == 'browser':
        if pool_holder[0] is None:
            pool_holder[0] = BrowserPool(log_)
        return fetch_browser(src, pool_holder[0])
    raise ValueError(f'unknown source type: {stype}')


def run_cycle(args, cfg: dict, sources: list[dict], hist: dd.NewsHistory, state: dict) -> dict:
    t0 = time.time()
    verbose = vlog(args.verbose)
    now = time.time()
    api_key = en.load_api_key()
    pool_holder: list = [None]

    fetched = 0
    fetch_errors = 0
    candidates: list[dict] = []
    seen_cycle_urls: set[str] = set()
    notif_titles: set[str] = set()

    try:
        for src in sources:
            if not src.get('enabled', True):
                continue
            if args.source and src.get('id') != args.source:
                continue
            if not args.once and not source_due(src, state, cfg, now):
                verbose(f"[skip] {src['id']}: interval not due")
                continue
            if src.get('type') == 'browser' and not cfg.get('browser_enabled', True):
                continue
            try:
                items = fetch_source(src, pool_holder, log)
            except Exception as e:  # noqa: BLE001
                fetch_errors += 1
                mark_fetched(state, src['id'], 0, False, cfg, now)
                log(f"[fetch] {src['id']} FAILED: {e}")
                continue
            mark_fetched(state, src['id'], len(items), True, cfg, now)
            fetched += len(items)
            verbose(f"[fetch] {src['id']}: {len(items)} items")
            for it in items:
                url = it.get('url', '')
                norm = dd.normalize_url(url)
                if not norm or norm in seen_cycle_urls:
                    continue
                if hist.seen_url(url):
                    hist.remember_url(url)  # refresh timestamp
                    continue
                if hist.duplicate_title(it.get('title', '')):
                    hist.remember_url(url)
                    continue
                seen_cycle_urls.add(norm)
                candidates.append({
                    'url': url,
                    'title': it.get('title', ''),
                    'snippet': it.get('snippet', ''),
                    'imageUrl': it.get('imageUrl', ''),
                    'publishedAt': it.get('publishedAt', ''),
                    'source': src.get('name', 'VEX News'),
                    'srcId': src.get('id', ''),
                    'fromNotification': bool(it.get('fromNotification')),
                })

        # in-cycle cross-source clustering: same story from N sources -> one entry
        clustered: list[dict] = []
        cluster_norms: list[str] = []
        for c in sorted(candidates, key=lambda x: (not x['fromNotification'], x.get('publishedAt') or '9')):
            norm = dd.normalize_title(c['title'])
            dup_in_cycle = False
            for prev in cluster_norms:
                if dd.similarity(norm, prev) >= dd.DUP_THRESHOLD:
                    dup_in_cycle = True
                    break
            if dup_in_cycle:
                continue
            cluster_norms.append(norm)
            clustered.append(c)

        cap = int(cfg.get('max_per_cycle', 30))
        batch = clustered[:cap]
        dropped = len(clustered) - len(batch)
    finally:
        if pool_holder[0] is not None:
            pool_holder[0].close()

    # enrich with article context (og:image + text) only for what we may publish
    for c in batch:
        if c['imageUrl'] and len(c['snippet']) > 120:
            continue
        img, body = fetch_article(c['url'])
        c['imageUrl'] = c['imageUrl'] or img
        if not c['snippet']:
            c['snippet'] = body[:400]
        c['body_text'] = body
        time.sleep(0.4)

    enriched: list[dict] = []
    for i in range(0, len(batch), en.BATCH_SIZE):
        chunk = batch[i:i + en.BATCH_SIZE]
        enriched.extend(en.enrich_batch(chunk, api_key, log))
        if i + en.BATCH_SIZE < len(batch):
            time.sleep(4.0)

    min_score = int(cfg.get('min_score', 60))
    accepted, rejected = [], []
    for e in enriched:
        if e.get('is_sports') and int(e.get('score', 0)) >= min_score:
            accepted.append(e)
        else:
            rejected.append(e)

    # Layer 5: event-level dedupe (AI story_key) — same event from ar/en sources collapses
    final: list[dict] = []
    story_dups = 0
    for e in accepted:
        key = e.get('story_key') or ''
        if key and hist.story_key_seen(key):
            hist.remember_url(e.get('url', ''))
            hist.remember_title(e.get('title', ''))
            story_dups += 1
            continue
        final.append(e)

    for c in batch:
        if c['fromNotification']:
            notif_titles.add(c['title'][:80])

    added_entries, total = pub.publish(NEWS_PATH, final, log, dry_run=args.dry_run)
    added = len(added_entries)
    if not args.dry_run:
        for e in added_entries:
            hist.remember_url(e.get('url', ''))
            hist.remember_title(e.get('title', ''))
            hist.remember_story_key(e.get('story_key', ''))
        for e in final:
            if e not in added_entries:  # already present in the store -> still a published story
                hist.remember_url(e.get('url', ''))
                hist.remember_title(e.get('title', ''))
        for e in rejected:
            hist.remember_url(e.get('url', ''))
            hist.remember_title(e.get('title', ''), rejected=True)
        hist.save()
        save_json(STATE_PATH, state)

    dt = time.time() - t0
    summary = (f"[cycle] fetched={fetched} errors={fetch_errors} new={len(candidates)} "
               f"clustered={len(batch)} dropped={dropped} storyDups={story_dups} published={added} "
               f"rejected={len(rejected)} store={total} "
               f"notif={len(notif_titles)} "
               f"time={dt:.1f}s")
    log(summary)
    return {'published': added, 'fetched': fetched, 'errors': fetch_errors}


def acquire_lock():
    """Prevent overlapping runs (systemd loop + cron fallback)."""
    try:
        import fcntl
    except ImportError:  # non-Linux dev box
        return open(os.devnull, 'w')
    f = open(LOCK_PATH, 'w')
    try:
        fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        log('[lock] another watcher instance holds the lock — exiting')
        f.close()
        sys.exit(0)
    return f


def main() -> int:
    parser = argparse.ArgumentParser(description='VEX News Engine watcher')
    parser.add_argument('--once', action='store_true', help='single full pass then exit')
    parser.add_argument('--verbose', action='store_true', help='per-item logging')
    parser.add_argument('--source', default='', help='run only this source id')
    parser.add_argument('--dry-run', action='store_true', help='no writes to news/history')
    parser.add_argument('--no-loop', action='store_true', help='alias of --once')
    args = parser.parse_args()
    if args.no_loop:
        args.once = True

    cfg = {**DEFAULT_CONFIG, **load_json(CONFIG_PATH, {})}
    if not cfg.get('enabled', True) and args.once:
        log('[config] news_config.json enabled=false — skipping cycle')
        return 0

    DATA.mkdir(parents=True, exist_ok=True)
    lock = acquire_lock()
    hist = dd.NewsHistory(str(HISTORY_PATH))
    sources = load_sources(str(SOURCES_PATH), log)
    state = load_json(STATE_PATH, {})

    log(f'[start] root={ROOT} sources={len(sources)} once={args.once} '
        f'enabled={cfg.get("enabled")} interval={cfg.get("interval_min")}m '
        f'minScore={cfg.get("min_score")} browser={cfg.get("browser_enabled")}')

    if args.once:
        try:
            run_cycle(args, cfg, sources, hist, state)
        except Exception as e:  # noqa: BLE001 — cron must not crash silently
            log(f'[cycle] FATAL: {e}')
            return 1
        finally:
            lock.close()
        return 0

    stop = {'flag': False}

    def _sig(_sig, _frm):
        stop['flag'] = True

    try:
        import signal
        signal.signal(signal.SIGTERM, _sig)
        signal.signal(signal.SIGINT, _sig)
    except Exception:  # noqa: BLE001
        pass

    while not stop['flag']:
        cfg = {**DEFAULT_CONFIG, **load_json(CONFIG_PATH, {})}
        if cfg.get('enabled', True):
            try:
                run_cycle(args, cfg, sources, hist, state)
            except Exception as e:  # noqa: BLE001
                log(f'[cycle] error: {e}')
        else:
            log('[config] disabled — idling')
        # reload sources each loop so edits to news_sources.json apply live
        sources = load_sources(str(SOURCES_PATH), log)
        interval = max(1, int(cfg.get('interval_min', 15))) * 60
        for _ in range(interval // 10):
            if stop['flag']:
                break
            time.sleep(10)

    lock.close()
    log('[stop] watcher shut down')
    return 0


if __name__ == '__main__':
    sys.exit(main())
