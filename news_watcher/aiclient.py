"""Multi-provider AI key ring — free keys in rotation, publishing never fails.

Gemini (native REST) plus any OpenAI-compatible API (OpenRouter, Groq, Together...)
form an ordered ring. A failing key is put into a persisted cooldown with
exponential backoff so quota is never wasted; the next key takes over. When every
key is cooling down the caller falls back to pure rules — the pipeline never stops.

Key sources (merged, deduped by id):
  env / .env   GEMINI_API_KEY, GEMINI_API_KEY_2..9,
               OPENROUTER_API_KEY, OPENROUTER_API_KEY_2..9
  data/news_keys.json
               {"keys": [{"provider": "gemini"|"openrouter"|"openai",
                          "key": "...", "model": "...", "base_url": "https://..."}]}

Cooldown state: data/news_keys_state.json  {"<id>": {"fails": n, "until": ts, "reason": str}}
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from pathlib import Path
from typing import Any

import requests

TIMEOUT = 60
COOLDOWN_QUOTA_BASE = 900.0        # 15 min after first 429, doubling each failure
COOLDOWN_QUOTA_CAP = 6 * 3600.0    # never dark longer than 6h on quota errors
COOLDOWN_BAD_KEY = 24 * 3600.0     # invalid key/model -> retry tomorrow or after edit
COOLDOWN_TRANSIENT = 300.0         # network / 5xx blips

_DEFAULT_MODEL = {
    'gemini': os.environ.get('VEX_GEMINI_MODEL', 'gemini-3.8-flash'),
    'openrouter': 'meta-llama/llama-3.3-70b-instruct:free',
    'openai': 'gpt-4o-mini',
}
_BASE_URL = {'openrouter': 'https://openrouter.ai/api/v1'}


class RingError(Exception):
    """HTTP-level provider failure (status 0 = network error)."""

    def __init__(self, status: int, body: str):
        super().__init__(f'HTTP {status}: {body[:200]}')
        self.status = status
        self.body = body


def _root() -> Path:
    v = os.environ.get('VEX_ROOT')
    if v:
        return Path(v)
    return Path(__file__).resolve().parent.parent


def _data_dir() -> Path:
    return _root() / 'data'


def _read_env_file(path: str) -> dict[str, str]:
    out: dict[str, str] = {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                out[k.strip()] = v.strip().strip(chr(34)).strip(chr(39))
    except OSError:
        pass
    return out


_ENV_KEY_RE = re.compile(r'^(GEMINI_API_KEY|OPENROUTER_API_KEY)(_\d+)?$')


def _all_env() -> dict[str, str]:
    merged: dict[str, str] = {}
    for k, v in os.environ.items():
        if _ENV_KEY_RE.match(k) and v:
            merged[k] = v
    for p in (
        str(_root() / '.env'),
        '/opt/vex1/.env',
    ):
        if not p:
            continue
        for k, v in _read_env_file(p).items():
            if _ENV_KEY_RE.match(k) and v:
                merged.setdefault(k, v)
    return merged


def _key_id(provider: str, model: str, key: str) -> str:
    return hashlib.sha1(f'{provider}|{model}|{key}'.encode('utf-8')).hexdigest()[:12]


def _entry(provider: str, key: str, model: str, base_url: str) -> dict:
    return {
        'id': _key_id(provider, model, key),
        'provider': provider,
        'key': key,
        'model': model,
        'base_url': base_url,
    }


def load_keys() -> list[dict]:
    entries: dict[str, dict] = {}
    for name, val in sorted(_all_env().items()):
        provider = 'gemini' if name.startswith('GEMINI') else 'openrouter'
        model = _DEFAULT_MODEL[provider]
        e = _entry(provider, val, model, _BASE_URL.get(provider, ''))
        entries[e['id']] = e
    try:
        with open(_data_dir() / 'news_keys.json', 'r', encoding='utf-8') as f:
            raw = json.load(f)
        for item in (raw.get('keys') or []) if isinstance(raw, dict) else []:
            if not isinstance(item, dict) or not item.get('key'):
                continue
            provider = str(item.get('provider') or 'gemini').lower()
            if provider not in ('gemini', 'openrouter', 'openai'):
                continue
            base = str(item.get('base_url') or _BASE_URL.get(provider, ''))
            if provider != 'gemini' and not base:
                continue  # openai-compatible without base_url is unusable
            model = str(item.get('model') or _DEFAULT_MODEL[provider])
            e = _entry(provider, str(item['key']), model, base)
            entries[e['id']] = e
    except (OSError, ValueError):
        pass
    return list(entries.values())


def _load_state() -> dict:
    try:
        with open(_data_dir() / 'news_keys_state.json', 'r', encoding='utf-8') as f:
            raw = json.load(f)
            return raw if isinstance(raw, dict) else {}
    except (OSError, ValueError):
        return {}


class KeyRing:
    def __init__(self, log):
        self.log = log
        self.keys = load_keys()
        self.state = _load_state()
        self.active_id = ''
        self._keys_mtime = _keys_mtime()

    # -- config hot-reload (news_keys.json edits apply next cycle) ------------
    def refresh(self) -> None:
        m = _keys_mtime()
        if m != self._keys_mtime:
            self.keys = load_keys()
            self._keys_mtime = m
            self.log(f'[ring] news_keys.json changed -> {len(self.keys)} keys loaded')

    # -- cooldown bookkeeping --------------------------------------------------
    def _healthy(self, k: dict) -> bool:
        s = self.state.get(k['id']) or {}
        return time.time() >= float(s.get('until', 0) or 0)

    def _save_state(self) -> None:
        d = _data_dir()
        try:
            d.mkdir(parents=True, exist_ok=True)
            tmp = str(d / 'news_keys_state.json') + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(self.state, f)
            os.replace(tmp, str(d / 'news_keys_state.json'))
        except OSError:
            pass

    def _mark_ok(self, k: dict) -> None:
        if self.state.pop(k['id'], None) is not None:
            self._save_state()
        self.active_id = k['id']

    def _mark_fail(self, k: dict, status: int, body: str) -> None:
        s = self.state.setdefault(k['id'], {'fails': 0})
        s['fails'] = int(s.get('fails', 0) or 0) + 1
        low = (body or '').lower()
        if status == 429 or 'quota' in low:
            cd = min(COOLDOWN_QUOTA_CAP, COOLDOWN_QUOTA_BASE * (2 ** (s['fails'] - 1)))
            why = 'quota 429'
        elif status in (401, 403, 404) or 'api_key_invalid' in low or ('api key' in low and 'valid' in low):
            cd, why = COOLDOWN_BAD_KEY, f'HTTP {status} bad key/model'
        elif status == 0:
            cd, why = COOLDOWN_TRANSIENT, 'network/parse error'
        else:
            cd, why = COOLDOWN_TRANSIENT, f'HTTP {status}'
        s['until'] = time.time() + cd
        s['reason'] = why
        self._save_state()
        self.log(f"[ring] {k['provider']} {k['model']} (…{k['key'][-4:]}) {why} "
                 f"-> cooldown {int(cd // 60)}m")

    # -- provider calls --------------------------------------------------------
    def _call(self, k: dict, prompt: str, max_tokens: int, temperature: float,
              want_json: bool) -> str:
        if k['provider'] == 'gemini':
            url = (f'https://generativelanguage.googleapis.com/v1beta/models/'
                   f"{k['model']}:generateContent?key={k['key']}")
            gen: dict[str, Any] = {'temperature': temperature, 'maxOutputTokens': max_tokens}
            if want_json:
                gen['responseMimeType'] = 'application/json'
            body = {'contents': [{'parts': [{'text': prompt}]}], 'generationConfig': gen}
            try:
                r = requests.post(url, json=body, timeout=TIMEOUT)
            except requests.RequestException as e:
                raise RingError(0, str(e)) from e
            if r.status_code != 200:
                raise RingError(r.status_code, r.text)
            try:
                return r.json()['candidates'][0]['content']['parts'][0]['text']
            except (ValueError, KeyError, IndexError) as e:
                raise RingError(0, f'bad gemini response: {e}') from e

        url = k['base_url'].rstrip('/') + '/chat/completions'
        headers = {'Authorization': f"Bearer {k['key']}"}
        if k['provider'] == 'openrouter':
            headers['HTTP-Referer'] = 'https://vex.deals'
            headers['X-Title'] = 'VEX News'
        body = {
            'model': k['model'],
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': temperature,
            'max_tokens': max_tokens,
        }
        try:
            r = requests.post(url, json=body, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            raise RingError(0, str(e)) from e
        if r.status_code != 200:
            raise RingError(r.status_code, r.text)
        try:
            return r.json()['choices'][0]['message']['content'] or ''
        except (ValueError, KeyError, IndexError, TypeError) as e:
            raise RingError(0, f'bad chat response: {e}') from e

    def _order(self) -> list[dict]:
        healthy = [k for k in self.keys if self._healthy(k)]
        healthy.sort(key=lambda k: k['id'] != self.active_id)  # active key first
        return healthy

    # -- public API ------------------------------------------------------------
    def probe(self) -> bool:
        """State-only health check (no HTTP, no quota burn)."""
        self.refresh()
        if not self.keys:
            self.log('[ring] no AI keys configured -> rules-only mode')
            return False
        healthy = self._order()
        if not healthy:
            self.log('[ring] all keys cooling down -> rules-only mode')
            return False
        self.log('[ring] healthy: ' + ', '.join(
            f"{k['provider']}/{k['model']}(…{k['key'][-4:]})" for k in healthy))
        return True

    def chat_json(self, prompt: str) -> Any:
        """Run the prompt on the first working key. Raises when the ring is empty."""
        self.refresh()
        ordered = self._order()
        if not ordered:
            raise RuntimeError('all AI keys cooling down')
        last = ''
        for k in ordered:
            try:
                text = self._call(k, prompt, 8192, 0.3, True)
                self._mark_ok(k)
                return _parse_json(text)
            except RingError as e:
                last = f"{k['provider']}(…{k['key'][-4:]}): HTTP {e.status} {e.body[:140]}"
                self._mark_fail(k, e.status, e.body)
            except Exception as e:  # noqa: BLE001 — JSON parse etc.
                last = f"{k['provider']}(…{k['key'][-4:]}): {str(e)[:140]}"
                self._mark_fail(k, 0, str(e))
        raise RuntimeError(f'all AI keys failed; last={last}')


def _keys_mtime() -> float:
    try:
        return os.path.getmtime(_data_dir() / 'news_keys.json')
    except OSError:
        return 0.0


def _parse_json(text: str) -> Any:
    t = (text or '').strip()
    if t.startswith('```'):
        t = re.sub(r'^```[a-zA-Z]*\n?', '', t)
        t = re.sub(r'\n?```\s*$', '', t)
    try:
        return json.loads(t)
    except ValueError:
        pass
    for opener, closer in (('[', ']'), ('{', '}')):
        i, j = t.find(opener), t.rfind(closer)
        if 0 <= i < j:
            try:
                return json.loads(t[i:j + 1])
            except ValueError:
                continue
    raise ValueError('response is not JSON')


_RING: KeyRing | None = None


def get_ring(log) -> KeyRing:
    global _RING
    if _RING is None:
        _RING = KeyRing(log)
    else:
        _RING.log = log
    return _RING
