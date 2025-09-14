#!/usr/bin/env python3
"""
Main launcher for Gordon - AI Cooking Assistant
Runs the API server from the project root with proper Python path setup.
"""

import sys
import os
from pathlib import Path

# Add the Gordon root directory to Python path
gordon_root = Path(__file__).parent
sys.path.insert(0, str(gordon_root))

# Now import and run the API server
if __name__ == '__main__':
    from backend.api_server import app
    
    print("🚀 Gordon - AI Cooking Assistant")
    print("=" * 40)
    print("📁 Project Structure:")
    print("   📂 Gordon/")
    print("   ├── 🐍 backend/     (Python API & AI services)")
    print("   ├── ⚛️  frontend/    (React TypeScript UI)")
    print("   └── 📁 categories/   (Classified images)")
    print("=" * 40)
    print("🔗 API Endpoints:")
    print("   📸 Recipe Generation: /api/recipes/generate")
    print("   🎬 Session Control: /api/session/start|stop|status")
    print("   📁 Categories: /api/categories")
    print("   🔗 Health Check: /api/health")
    print("=" * 40)
    
    # Configure Flask
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
    
    # Run server
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True
    ) 