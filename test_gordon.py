#!/usr/bin/env python3
"""
Main test script for Gordon - AI Cooking Assistant
Runs integration tests from the project root with proper Python path setup.
"""

import sys
from pathlib import Path

# Add the Gordon root directory to Python path
gordon_root = Path(__file__).parent
sys.path.insert(0, str(gordon_root))

# Now import and run the tests
if __name__ == '__main__':
    from backend.test_integration import main
    
    print("🚀 Gordon - AI Cooking Assistant")
    print("🧪 Running Integration Tests...")
    print("=" * 40)
    
    sys.exit(main()) 