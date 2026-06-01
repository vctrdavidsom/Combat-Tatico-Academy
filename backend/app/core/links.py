from __future__ import annotations

import re
from typing import Optional
from urllib.parse import parse_qs, urlparse

_DRIVE_HOSTS = {"drive.google.com", "docs.google.com"}


def normalize_google_drive_download_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return url

    parsed = urlparse(url)
    if parsed.netloc.lower() not in _DRIVE_HOSTS:
        return url

    query = parse_qs(parsed.query)
    file_id = query.get("id", [None])[0]
    if file_id:
        return f"https://drive.google.com/uc?export=download&id={file_id}"

    match = re.search(r"/file/d/([^/]+)", parsed.path)
    if match:
        return f"https://drive.google.com/uc?export=download&id={match.group(1)}"

    match = re.search(r"/d/([^/]+)", parsed.path)
    if match:
        return f"https://drive.google.com/uc?export=download&id={match.group(1)}"

    return url
