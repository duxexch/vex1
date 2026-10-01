"""Source fetchers: RSS (requests+feedparser), HTML listings (requests+bs4),
JS-heavy listings (Playwright Chromium), article meta/body extraction,
and in-page web-notification capture."""
from __future__ import annotations

import re
import time
from urllib.parse import urljoin, urlsplit

import feedparser
import requests
from bs4 import BeautifulSoup

UA = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
)
HEADERS = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ar,en;q=0.8',
}
TIMEOUT = 20

NOTIF_HOOK_JS = r"""
window.__vexNotif = window.__vexNotif || [];
try {
  const NativeNotif = window.Notification;
  if (NativeNotif) {
    window.Notification = new Proxy(NativeNotif, {
      construct(target, args) {
        try {
          window.__vexNotif.push({
            title: String(args[0] || ''),
            body: String((args[1] || {}).body || ''),
            url: location.href,
            ts: Date.now()
          });
        } catch (e) {}
        return Reflect.construct(target, args);
      }
    });
  }
} catch (e) {}
try {
  if (window.ServiceWorkerRegistration && ServiceWorkerRegistration.prototype) {
    const orig = ServiceWorkerRegistration.prototype.showNotification;
    ServiceWorkerRegistration.prototype.showNotification = function (title, opts) {
      try {
        window.__vexNotif.push({
          title: String(title || ''),
          body: String((opts || {}).body || ''),
          url: location.href,
          ts: Date.now()
        });
      } catch (e) {}
      return orig.apply(this, arguments);
    };
  }
} catch (e) {}
"""


def _iso(ts_struct) -> str:
    try:
        import calendar
        return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(calendar.timegm(ts_struct)))
    except Exception:  # noqa: BLE001
        return ''


def _clean_text(html: str, limit: int = 500) -> str:
    text = BeautifulSoup(html or '', 'lxml').get_text(' ', strip=True)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:limit]


def _entry_image(entry) -> str:
    try:
        if getattr(entry, 'media_content', None):
            return entry.media_content[0].get('url', '')
        if getattr(entry, 'media_thumbnail', None):
            return entry.media_thumbnail[0].get('url', '')
        if getattr(entry, 'enclosures', None):
            for enc in entry.enclosures:
                if str(enc.get('type', '')).startswith('image'):
                    return enc.get('href', '')
        if getattr(entry, 'links', None):
            for ln in entry.links:
                if ln.get('rel') == 'enclosure' and str(ln.get('type', '')).startswith('image'):
                    return ln.get('href', '')
    except Exception:  # noqa: BLE001
        pass
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', entry.get('summary', '') or '')
    return m.group(1) if m else ''


def fetch_rss(source: dict) -> list[dict]:
    resp = requests.get(source['feed'], headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    feed = feedparser.parse(resp.content)
    out = []
    for entry in feed.entries[: source.get('max_items', 20)]:
        url = (entry.get('link') or '').strip()
        title = _clean_text(entry.get('title', ''), 300)
        if not url or not title:
            continue
        published = ''
        for key in ('published_parsed', 'updated_parsed'):
            if entry.get(key):
                published = _iso(entry[key])
                break
        out.append({
            'url': url,
            'title': title,
            'snippet': _clean_text(entry.get('summary', ''), 400),
            'publishedAt': published,
            'imageUrl': _entry_image(entry),
        })
    return out


def _parse_html_fragment(html: str, source: dict, base_url: str) -> list[dict]:
    out: list[dict] = []
    soup = BeautifulSoup(html, 'lxml')

    if source.get('link_regex'):
        rx = re.compile(source['link_regex'])
        title_rx = re.compile(source['title_regex']) if source.get('title_regex') else None
        seen: set[str] = set()
        for m in rx.finditer(html):
            url = m.group(1)
            if url.startswith('/') or not url.startswith('http'):
                url = urljoin(base_url, url)
            if url in seen:
                continue
            seen.add(url)
            title = ''
            if title_rx:
                tm = title_rx.search(html[m.start(): m.start() + 800])
                title = tm.group(1) if tm else ''
            if not title:
                # fallback: anchor text near the match
                anchor = soup.find('a', href=re.compile(re.escape(m.group(1))))
                title = anchor.get_text(' ', strip=True) if anchor else ''
            if title:
                out.append({'url': url, 'title': _clean_text(title, 300), 'snippet': '', 'publishedAt': '', 'imageUrl': ''})
            if len(out) >= source.get('max_items', 20):
                break
        return out

    item_sel = source.get('item_selector') or 'a'
    for a in soup.select(item_sel)[: source.get('max_items', 20)]:
        url = a.get('href') or ''
        if url.startswith('/'):
            url = urljoin(base_url, url)
        if not url.startswith('http'):
            continue
        if source.get('title_selector'):
            node = a.select_one(source['title_selector']) or a
            title = node.get_text(' ', strip=True)
        else:
            title = a.get_text(' ', strip=True)
        img = ''
        if source.get('image_selector'):
            holder = a if source.get('image_from_link') else soup
            img_node = holder.select_one(source['image_selector'])
            if img_node:
                img = img_node.get('src') or img_node.get('data-src') or ''
                if img.startswith('/'):
                    img = urljoin(base_url, img)
        if len(title) < int(source.get('min_title_len', 15)):
            continue
        out.append({
            'url': url,
            'title': _clean_text(title, 300),
            'snippet': '',
            'publishedAt': '',
            'imageUrl': img,
        })
    return out


def _resp_text(resp) -> str:
    # requests falls back to ISO-8859-1 when the server sends no charset -> mojibake
    # for UTF-8 pages (Arabic sites like filgoal). Detect the real encoding.
    if resp.encoding in (None, 'ISO-8859-1'):
        resp.encoding = resp.apparent_encoding or 'utf-8'
    return resp.text


def fetch_html(source: dict) -> list[dict]:
    resp = requests.get(source['list_url'], headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return _parse_html_fragment(_resp_text(resp), source, source['list_url'])


class BrowserPool:
    """One Chromium instance per cycle; close() frees the RAM between cycles."""

    def __init__(self, log):
        self.log = log
        self._pw = None
        self._browser = None
        self._ctx = None

    def _ensure(self):
        if self._ctx:
            return
        from playwright.sync_api import sync_playwright
        self._pw = sync_playwright().start()
        self._browser = self._pw.chromium.launch(
            headless=True,
            args=[
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-gpu',
                '--renderer-process-limit=2',
                '--disable-extensions',
                '--mute-audio',
            ],
        )
        self._ctx = self._browser.new_context(
            user_agent=UA,
            locale='en-US',
            viewport={'width': 1366, 'height': 900},
        )

    def page_with_hooks(self):
        self._ensure()
        page = self._ctx.new_page()
        try:
            page.add_init_script(NOTIF_HOOK_JS)
        except Exception as e:  # noqa: BLE001
            self.log(f'[browser] init-script note: {e}')
        return page

    def drain_notifications(self, page) -> list[dict]:
        try:
            items = page.evaluate('window.__vexNotif ? window.__vexNotif.splice(0, 25) : []')
            return items if isinstance(items, list) else []
        except Exception:  # noqa: BLE001
            return []

    def close(self) -> None:
        for closer in (
            lambda: self._ctx and self._ctx.close(),
            lambda: self._browser and self._browser.close(),
            lambda: self._pw and self._pw.stop(),
        ):
            try:
                closer()
            except Exception:  # noqa: BLE001
                pass
        self._ctx = self._browser = self._pw = None


def fetch_browser(source: dict, pool: BrowserPool) -> list[dict]:
    page = pool.page_with_hooks()
    try:
        parts = urlsplit(source['list_url'])
        origin = f'{parts.scheme}://{parts.netloc}'
        try:
            pool._ctx.grant_permissions(['notifications'], origin=origin)
        except Exception as e:  # noqa: BLE001
            pool.log(f'[browser] grant_permissions note: {e}')
        page.goto(source['list_url'], wait_until='domcontentloaded', timeout=30000)
        sel = source.get('wait_selector')
        if sel:
            try:
                page.wait_for_selector(sel, timeout=8000)
            except Exception:  # noqa: BLE001
                pass
        else:
            page.wait_for_timeout(2500)
        items = _parse_html_fragment(page.content(), source, source['list_url'])
        # notification capture: foreground pushes while we are on the page
        for n in pool.drain_notifications(page)[:10]:
            title = (n.get('title') or '').strip()
            if len(title) >= 20:
                items.insert(0, {
                    'url': n.get('url') or source['list_url'],
                    'title': title,
                    'snippet': (n.get('body') or '')[:400],
                    'publishedAt': '',
                    'imageUrl': '',
                    'fromNotification': True,
                })
        return items[: source.get('max_items', 20)]
    finally:
        try:
            page.close()
        except Exception:  # noqa: BLE001
            pass


def fetch_article(url: str) -> tuple[str, str]:
    """Returns (og:image, plain-text body excerpt) for one article URL."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
    except Exception:  # noqa: BLE001
        return '', ''
    soup = BeautifulSoup(_resp_text(resp), 'lxml')
    img = ''
    og = soup.find('meta', attrs={'property': 'og:image'})
    if og and og.get('content'):
        img = og['content'].strip()
    paras = []
    for p in soup.select('article p, main p, .article-body p, p'):
        t = re.sub(r'\s+', ' ', p.get_text(' ', strip=True))
        if len(t) > 60:
            paras.append(t)
        if sum(len(x) for x in paras) > 2200:
            break
    return img, ' '.join(paras)[:2400]
