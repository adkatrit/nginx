#!/usr/bin/env python3
"""
Tiny static file server for the MySongs player.

Why not `python -m http.server`?
- Browsers often use HTTP Range requests for reliable seeking in large audio files.
- Some clients disconnect mid-transfer which can spam ConnectionResetError / BrokenPipeError.

Defaults:
- Serves ./nginx/site (relative to this file)
- Host: 127.0.0.1
- Port: 8000
"""

from __future__ import annotations

import argparse
import io
import os
import re
import sys
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


_RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)\s*$")


class RangeRequestHandler(SimpleHTTPRequestHandler):
    """
    SimpleHTTPRequestHandler with:
    - basic single-range support: "Range: bytes=start-end"
    - quiet handling of common client disconnect errors
    """

    def log_message(self, fmt: str, *args) -> None:
        # Keep logs readable (still prints requests/errors)
        sys.stderr.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), fmt % args))

    def copyfile(self, source: io.BufferedReader, outputfile: io.BufferedWriter) -> None:
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            # Client closed connection; ignore.
            pass

    def _parse_range(self, file_size: int) -> tuple[int, int] | None:
        header = self.headers.get("Range")
        if not header:
            return None
        m = _RANGE_RE.match(header.strip())
        if not m:
            return None

        a, b = m.group(1), m.group(2)
        if a == "" and b == "":
            return None

        if a == "":
            # Suffix: last N bytes.
            n = int(b)
            if n <= 0:
                return None
            start = max(0, file_size - n)
            end = file_size - 1
            return (start, end)

        start = int(a)
        end = int(b) if b != "" else file_size - 1
        if start < 0 or end < 0 or start > end:
            return None
        if start >= file_size:
            return None
        end = min(end, file_size - 1)
        return (start, end)

    def send_head(self):  # noqa: N802 (stdlib API)
        # Largely based on stdlib's SimpleHTTPRequestHandler.send_head,
        # but with Range support for regular files.
        url = urlsplit(self.path)
        path = self.translate_path(url.path)
        f = None
        try:
            if os.path.isdir(path):
                if not url.path.endswith("/"):
                    self.send_response(HTTPStatus.MOVED_PERMANENTLY)
                    new_path = url.path + "/"
                    if url.query:
                        new_path = new_path + "?" + url.query
                    self.send_header("Location", new_path)
                    self.end_headers()
                    return None
                for index in ("index.html", "index.htm"):
                    index_path = os.path.join(path, index)
                    if os.path.exists(index_path):
                        path = index_path
                        break
                else:
                    return self.list_directory(path)

            ctype = self.guess_type(path)
            f = open(path, "rb")
            fs = os.fstat(f.fileno())
            file_size = fs.st_size

            rng = self._parse_range(file_size)
            if rng is None and self.headers.get("Range"):
                # Range header present but invalid/unsatisfiable.
                f.close()
                self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                self.send_header("Content-Range", f"bytes */{file_size}")
                self.end_headers()
                return None

            if rng is None:
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-type", ctype)
                self.send_header("Accept-Ranges", "bytes")
                self.send_header("Content-Length", str(file_size))
                self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                self.end_headers()
                return f

            start, end = rng
            length = end - start + 1

            self.send_response(HTTPStatus.PARTIAL_CONTENT)
            self.send_header("Content-type", ctype)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(length))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()

            f.seek(start)
            # `http.server` will call `close()` on whatever we return.
            # `contextlib.closing(...)` is a context manager and *does not* expose
            # a `.close()` method, which triggers AttributeError during cleanup.
            return _FileSlice(f, length)
        except OSError:
            if f:
                f.close()
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return None


class _FileSlice(io.RawIOBase):
    """Read-only wrapper that exposes only the first `n` bytes of a file."""

    def __init__(self, f: io.BufferedReader, n: int) -> None:
        self._f = f
        self._remaining = n

    def readable(self) -> bool:
        return True

    def readinto(self, b) -> int:  # type: ignore[override]
        if self._remaining <= 0:
            return 0
        view = memoryview(b)
        if len(view) > self._remaining:
            view = view[: self._remaining]
        n = self._f.readinto(view)
        if not n:
            return 0
        self._remaining -= n
        return n

    def close(self) -> None:
        try:
            self._f.close()
        finally:
            super().close()


def main() -> int:
    here = Path(__file__).resolve().parent
    default_dir = here / "nginx" / "site"

    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--dir", default=str(default_dir), help="Directory to serve (defaults to ./nginx/site)")
    args = parser.parse_args()

    serve_dir = Path(args.dir).resolve()
    if not serve_dir.exists():
        raise SystemExit(f"Directory not found: {serve_dir}")

    # Python 3.7+ supports passing directory= to the handler.
    def handler(*h_args, **h_kwargs):
        return RangeRequestHandler(*h_args, directory=str(serve_dir), **h_kwargs)

    httpd = ThreadingHTTPServer((args.host, args.port), handler)
    url_host = "localhost" if args.host in ("127.0.0.1", "0.0.0.0") else args.host
    print(f"Serving {serve_dir} at http://{url_host}:{args.port}/ (Ctrl+C to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())

