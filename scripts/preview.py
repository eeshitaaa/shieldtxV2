"""Serve dist with the same public scanner forwarding route as Vercel."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from urllib.request import Request, urlopen
import json
import re

ROOT = Path(__file__).resolve().parents[1] / 'dist'


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        url = urlsplit(self.path)
        if url.path != '/api/scanner-preview':
            return super().do_GET()
        address = parse_qs(url.query).get('address', [''])[0]
        code, payload = 400, {'error': 'Invalid address'}
        if re.fullmatch(r'0x[0-9a-fA-F]{40}', address):
            try:
                req = Request('https://www.shieldtx.xyz/api/scanner-preview?address=' + address,
                              headers={'Accept': 'application/json'})
                with urlopen(req, timeout=10) as response:
                    payload, code = json.load(response), 200
            except Exception:
                code, payload = 502, {'error': 'Scanner unavailable'}
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 4202), PreviewHandler).serve_forever()
