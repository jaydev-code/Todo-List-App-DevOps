#!/usr/bin/env python3
# DevOps Dashboard PWA Server
import http.server
import socketserver
import os
import sys

PORT = 8080

class PWAHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # PWA required headers
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    # Change to app-artifact directory
    os.chdir('app-artifact')
    
    print("=" * 50)
    print("🚀 DevOps Dashboard PWA")
    print("=" * 50)
    print(f"📂 Serving from: {os.getcwd()}")
    print(f"🌐 Server URL: http://localhost:{PORT}")
    print(f"           or: http://127.0.0.1:{PORT}")
    print()
    print("📱 Mobile Testing:")
    print("   1. Connect phone to same WiFi")
    print("   2. Find computer IP address:")
    print("      - Windows: ipconfig")
    print("      - Linux/Mac: ifconfig or hostname -I")
    print(f"   3. Open: http://[YOUR-IP]:{PORT} on phone")
    print()
    print("⚡ Quick Commands:")
    print("   • Refresh: Ctrl+R")
    print("   • Open DevTools: F12 or Ctrl+Shift+I")
    print("   • Stop server: Ctrl+C")
    print("=" * 50)
    print()
    
    with socketserver.TCPServer(("", PORT), PWAHandler) as httpd:
        print(f"✅ Server started successfully!")
        print(f"👁️  Open your browser to: http://localhost:{PORT}")
        print()
        httpd.serve_forever()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
        sys.exit(0)
    except FileNotFoundError:
        print("\n❌ ERROR: 'app-artifact' directory not found!")
        print("Current directory:", os.getcwd())
        print("Make sure you're in the project root and app-artifact exists.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        sys.exit(1)
