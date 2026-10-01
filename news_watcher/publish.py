"""Atomic publishing into data/sports_news.json (read by the Express server)."""
from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone

MAX_ITEMS = 300


def load_news(path: str) -> dict:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, dict) and isinstance(data.get('items'), list):
            return data
        if isinstance(data, list):
            return {'items': data, 'updatedAt': ''}
    except (OSError, ValueError):
        pass
    return {'items': [], 'updatedAt': ''}


def existing_keys(store: dict) -> set[str]:
    keys = set()
    for it in store.get('items', []):
        if isinstance(it, dict):
            if it.get('slug'):
                keys.add(it['slug'])
            if it.get('id'):
                keys.add(it['id'])
    return keys


def to_item(e: dict) -> dict:
    pub = e.get('publishedAt') or datetime.now(timezone.utc).isoformat()
    return {
        'id': e['id'],
        'slug': e['slug'],
        'title': e['title_ar'],
        'summary': e['summary_ar'],
        'titleEn': e['title_en'],
        'summaryEn': e['summary_en'],
        'body': e.get('body_ar') or [],
        'bodyEn': e.get('body_en') or [],
        'source': e.get('source') or 'VEX News',
        'sourceUrl': e.get('sourceUrl') or '',
        'publishedAt': pub,
        'category': e.get('category_ar') or 'رياضات أخرى',
        'categoryKey': e.get('category_key') or 'other',
        'imageUrl': e.get('imageUrl') or '',
        'score': e.get('score', 60),
    }


def publish(path: str, enriched: list[dict], log, dry_run: bool = False) -> tuple[int, int]:
    """Merge enriched candidates into the news store. Returns (added, total)."""
    store = load_news(path)
    items = store.get('items', [])
    keys = existing_keys(store)
    seen_slugs = set(k for k in keys)

    added = 0
    for e in enriched:
        if not e.get('id') or e['id'] in keys or e.get('slug') in seen_slugs:
            continue
        item = to_item(e)
        # slug uniqueness against existing store
        slug = item['slug'] or item['id'].lower()
        base, n = slug, 2
        while slug in seen_slugs:
            slug = f'{base}-{n}'
            n += 1
        item['slug'] = slug
        items.append(item)
        keys.add(item['id'])
        seen_slugs.add(slug)
        added += 1

    def sort_key(it: dict) -> str:
        v = it.get('publishedAt') or ''
        try:
            return datetime.fromisoformat(v.replace('Z', '+00:00')).isoformat()
        except ValueError:
            return v

    items.sort(key=sort_key, reverse=True)
    items = items[:MAX_ITEMS]
    store = {'items': items, 'updatedAt': datetime.now(timezone.utc).isoformat()}

    if dry_run:
        log(f'[publish] dry-run: would add {added}, store would hold {len(items)}')
        return added, len(items)

    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(store, f, ensure_ascii=False, indent=None, separators=(',', ':'))
    os.replace(tmp, path)
    return added, len(items)
