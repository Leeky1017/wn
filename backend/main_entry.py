#!/usr/bin/env python3
"""
WriteNow Backend Entry Point for PyInstaller packaging.
This file is used when running the packaged executable.
"""
import argparse
import os
import sys

# Ensure the app module is importable
if getattr(sys, 'frozen', False):
    # Running as compiled
    base_path = sys._MEIPASS
    sys.path.insert(0, base_path)
else:
    base_path = os.path.dirname(os.path.abspath(__file__))

def main():
    parser = argparse.ArgumentParser(description='WriteNow Backend Server')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind to')
    args = parser.parse_args()

    import uvicorn
    from app.main import app
    
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")

if __name__ == '__main__':
    main()
