"""Polite HTTP client shared by every ATS adapter.

Named netclient, not http: a module called `http.py` inside this package
shadows Python's stdlib `http` package whenever a script in this directory is
run directly, because Python puts the script's own directory on sys.path[0].
That broke `python src/lmstudy/analyze.py` with "No module named
'http.client'; 'http' is not a package" — urllib3 resolved `http` to this file.
Both the README and the workflow invoke scripts that way.

Compliance posture (see docs/methods.md):
  * identifies itself honestly in the User-Agent, with a contact
  * never authenticates and never circumvents any access control
  * rate-limits per host
  * caches with ETag/If-None-Match so repeat runs are cheap for the host
Only publicly documented, unauthenticated endpoints are contacted.
"""
from __future__ import annotations

import json
import os
import time
import threading
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlparse

import requests

USER_AGENT = os.environ.get(
    "LMSTUDY_USER_AGENT",
    "lmstudy-research/0.1 (academic labor-market study; "
    "+https://github.com/hendeal-cyber/Modern-Labor-Market-Data-Submission)",
)

DEFAULT_MIN_INTERVAL = 1.0  # seconds between requests to the same host
DEFAULT_TIMEOUT = 30


@dataclass
class Response:
    """Outcome of one request. `ok` is False for every non-fatal failure."""

    url: str
    status: int
    data: Any = None
    etag: str | None = None
    not_modified: bool = False
    error: str | None = None
    listed: int | None = None   # postings the board listed, before any filtering

    @property
    def ok(self) -> bool:
        return self.status == 200 and self.data is not None


@dataclass
class PoliteSession:
    min_interval: float = DEFAULT_MIN_INTERVAL
    timeout: int = DEFAULT_TIMEOUT
    max_retries: int = 3
    _last_hit: dict[str, float] = field(default_factory=dict)
    _etags: dict[str, str] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock)
    _session: requests.Session = field(default_factory=requests.Session)

    def _wait_for_host(self, url: str) -> None:
        host = urlparse(url).netloc
        with self._lock:
            last = self._last_hit.get(host)
            if last is not None:
                delta = time.monotonic() - last
                if delta < self.min_interval:
                    time.sleep(self.min_interval - delta)
            self._last_hit[host] = time.monotonic()

    def get_json(self, url: str, **kwargs) -> Response:
        return self._request("GET", url, **kwargs)

    def post_json(self, url: str, payload: dict, **kwargs) -> Response:
        return self._request("POST", url, json_body=payload, **kwargs)

    def get_bytes(self, url: str, **kwargs) -> Response:
        """Fetch a binary body — a zip archive of public statistics.

        Same politeness and retry handling as the JSON path; `data` is bytes.
        """
        return self._request("GET", url, want_bytes=True, **kwargs)

    def get_text(self, url: str, **kwargs) -> Response:
        """Fetch a body that is not JSON — an RSS or Atom feed.

        Same politeness, retry and status handling as get_json; only the Accept
        header and the body parsing differ. `data` is the raw text.
        """
        return self._request("GET", url, want_text=True, **kwargs)

    def _request(
        self,
        method: str,
        url: str,
        json_body: dict | None = None,
        use_etag: bool = True,
        want_text: bool = False,
        want_bytes: bool = False,
    ) -> Response:
        if want_bytes:
            accept = "application/zip, application/octet-stream, */*"
        elif want_text:
            accept = ("application/rss+xml, application/atom+xml, "
                      "application/xml, text/xml")
        else:
            accept = "application/json"
        headers = {"User-Agent": USER_AGENT, "Accept": accept}
        if use_etag and url in self._etags:
            headers["If-None-Match"] = self._etags[url]
        if json_body is not None:
            headers["Content-Type"] = "application/json"

        last_error = None
        for attempt in range(self.max_retries):
            self._wait_for_host(url)
            try:
                resp = self._session.request(
                    method,
                    url,
                    headers=headers,
                    json=json_body,
                    timeout=self.timeout,
                )
            except requests.RequestException as exc:
                last_error = f"{type(exc).__name__}: {exc}"
                time.sleep(2**attempt)
                continue

            if resp.status_code == 304:
                return Response(url, 304, not_modified=True)

            # Back off and retry on throttling or transient server errors only.
            if resp.status_code == 429 or 500 <= resp.status_code < 600:
                retry_after = resp.headers.get("Retry-After")
                delay = float(retry_after) if (retry_after or "").isdigit() else 2**attempt
                last_error = f"HTTP {resp.status_code}"
                time.sleep(min(delay, 30))
                continue

            # 404 is an ordinary, expected answer during token discovery.
            if resp.status_code != 200:
                return Response(url, resp.status_code, error=f"HTTP {resp.status_code}")

            etag = resp.headers.get("ETag")
            if etag and use_etag:
                self._etags[url] = etag
            if want_bytes:
                return Response(url, 200, data=resp.content, etag=etag)
            if want_text:
                return Response(url, 200, data=resp.text, etag=etag)
            try:
                return Response(url, 200, data=resp.json(), etag=etag)
            except json.JSONDecodeError as exc:
                return Response(url, 200, error=f"non-JSON body: {exc}")

        return Response(url, 0, error=last_error or "exhausted retries")
