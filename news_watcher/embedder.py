"""Semantic dedupe layer using Gemini embeddings.

The embedding endpoint (gemini-embedding-001) is billed/quota-limited separately
from text generation, so it keeps working while generateContent is 429-blocked.
Threshold 0.80: same-event titles measured 0.819-0.825 cosine, unrelated 0.458.
"""
from __future__ import annotations

import json
import os

import requests

from enrich import load_api_key

API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents'
DIMS = 768
THRESHOLD = 0.80
_BATCH = 16
_TIMEOUT = 30


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    if not na or not nb:
        return 0.0
    return dot / (na * nb)


def embed_texts(texts: list[str], log, api_key: str = '') -> list[list[float] | None]:
    """Embeds texts in batches of 16. Failed entries stay None (layer skips them)."""
    out: list[list[float] | None] = [None] * len(texts)
    if not texts:
        return out
    key = api_key or load_api_key()
    if not key:
        return out
    for start in range(0, len(texts), _BATCH):
        chunk = texts[start:start + _BATCH]
        reqs = [{
            'model': 'models/gemini-embedding-001',
            'content': {'parts': [{'text': (t or ' ')[:2000]}]},
            'outputDimensionality': DIMS,
        } for t in chunk]
        try:
            r = requests.post(API_URL, params={'key': key}, json={'requests': reqs}, timeout=_TIMEOUT)
            r.raise_for_status()
            embs = r.json().get('embeddings', [])
            for j, emb in enumerate(embs):
                if j < len(chunk) and isinstance(emb, dict) and emb.get('values'):
                    out[start + j] = emb['values']
        except Exception as e:  # noqa: BLE001
            log(f'[embed] batch failed: {str(e)[:160]}')
    return out


class EmbedStore:
    """id -> vector for published titles (data/news_embs.json)."""

    def __init__(self, path):
        self.path = str(path)
        self.data: dict[str, list[float]] = {}
        self.load()

    def load(self) -> None:
        try:
            with open(self.path, 'r', encoding='utf-8') as f:
                raw = json.load(f)
            if isinstance(raw, dict):
                self.data = {k: v for k, v in raw.items() if isinstance(v, list) and v}
        except (OSError, ValueError):
            self.data = {}

    def save(self) -> None:
        os.makedirs(os.path.dirname(self.path) or '.', exist_ok=True)
        tmp = self.path + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, separators=(',', ':'))
        os.replace(tmp, self.path)

    def put_many(self, ids: list[str], vecs: list[list[float] | None]) -> int:
        n = 0
        for i, v in zip(ids, vecs):
            if v:
                self.data[i] = [round(float(x), 5) for x in v]
                n += 1
        return n

    def prune(self, keep_ids: set[str]) -> None:
        self.data = {k: v for k, v in self.data.items() if k in keep_ids}


def backfill(store: EmbedStore, items: list[dict], log) -> None:
    """Embed titles of published items that do not have a vector yet."""
    missing = [it for it in items if it.get('id') and it['id'] not in store.data]
    if not missing:
        return
    vecs = embed_texts([it.get('title', '') or it.get('titleAr', '') or '' for it in missing], log)
    if store.put_many([it['id'] for it in missing], vecs):
        store.save()
        log(f'[embed] backfilled {sum(1 for v in vecs if v)} vectors')


def partition_by_embedding(
    reps: list[dict],
    stored: list[tuple[str, list[float]]],  # (title, vector) of already-published items
    log,
) -> tuple[list[dict], list[dict]]:
    """Returns (keep, dropped) for rep candidates whose titles semantically match
    an existing story or an earlier rep in the same batch."""
    if not reps:
        return [], []
    vecs = embed_texts([r.get('title', '') or '' for r in reps], log)
    keep: list[dict] = []
    kept_vecs: list[list[float]] = []
    dropped: list[dict] = []
    for rep, vec in zip(reps, vecs):
        if vec is None:
            keep.append(rep)          # no vector -> cannot judge, let other layers decide
            continue
        reason = ''
        for _t, sv in stored:
            if sv and cosine(vec, sv) >= THRESHOLD:
                reason = 'stored'
                break
        if not reason:
            for kv in kept_vecs:
                if cosine(vec, kv) >= THRESHOLD:
                    reason = 'in-cycle'
                    break
        if reason:
            rep['_embed_dup'] = reason
            dropped.append(rep)
        else:
            keep.append(rep)
            kept_vecs.append(vec)
    return keep, dropped
