# -*- coding: utf-8 -*-
"""
Local HTTP Server for Botany Quiz & Study Application.
"""
import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable caching during local dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run():
    os.chdir(DIRECTORY)
    # Find free port if 8080 is busy
    port = PORT
    max_tries = 10
    httpd = None
    for p in range(port, port + max_tries):
        try:
            httpd = socketserver.TCPServer(("", p), Handler)
            port = p
            break
        except OSError:
            continue

    if not httpd:
        print(f"Error: Could not bind to port {PORT}-{PORT+max_tries}")
        sys.exit(1)

    url = f"http://localhost:{port}/index.html"
    print("=" * 60)
    print(" 🌱 WEBSITE ÔN TẬP HỆ THỐNG THỰC VẬT 2025 - ĐH NÔNG LÂM TP.HCM")
    print("=" * 60)
    print(f" Server đang chạy tại: {url}")
    print(" Mở trình duyệt để bắt đầu ôn tập...")
    print(" Nhấn Ctrl + C để dừng server.")
    print("=" * 60)

    webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng server.")
        httpd.server_close()

if __name__ == '__main__':
    run()
