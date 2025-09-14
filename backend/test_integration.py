#!/usr/bin/env python3
"""
Integration test script for Gordon backend.
Tests recipe generation and API endpoints.
"""

import sys
from pathlib import Path

def test_recipe_generation():
    """Test recipe generation with a sample image."""
    print("🧪 Testing Recipe Generation...")
    
    try:
        from backend.recipe_generator import get_recipe_generator
        
        # Use an existing image for testing
        test_image = Path('/Users/harrisonfulford/SWE/misc/htn/model-testing/data/images/club_sandwich/club_sandwich_1.jpg')
        
        if not test_image.exists():
            print("❌ Test image not found. Please run with an image path:")
            print("   python3 test_integration.py /path/to/image.jpg")
            return False
        
        generator = get_recipe_generator()
        result = generator.generate_recipes_from_image(test_image)
        
        if result.get('error'):
            print(f"❌ Recipe generation failed: {result['error']}")
            return False
        
        recipes = result.get('recipes', [])
        print(f"✅ Generated {len(recipes)} recipes:")
        
        for i, recipe in enumerate(recipes, 1):
            print(f"  {i}. {recipe['name']}")
            print(f"     Cook time: {recipe['cookTime']} min")
            print(f"     Difficulty: {recipe['difficulty']}")
            print(f"     Timeline steps: {len(recipe.get('timeline', []))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Recipe generation test failed: {e}")
        return False

def test_api_health():
    """Test API server health check."""
    print("\n🧪 Testing API Server...")
    
    try:
        import requests
        
        response = requests.get('http://localhost:5001/api/health', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API server is healthy")
            print(f"   Session active: {data.get('session_active', False)}")
            print(f"   Webcam running: {data.get('webcam_running', False)}")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ API server not running. Start it with: python3 api_server.py")
        return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def main():
    """Run integration tests."""
    print("🚀 Gordon Integration Tests")
    print("=" * 40)
    
    # Test recipe generation
    recipe_test = test_recipe_generation()
    
    # Test API server
    api_test = test_api_health()
    
    print("\n" + "=" * 40)
    print("📊 Test Results:")
    print(f"   Recipe Generation: {'✅ PASS' if recipe_test else '❌ FAIL'}")
    print(f"   API Server: {'✅ PASS' if api_test else '❌ FAIL'}")
    
    if recipe_test and api_test:
        print("\n🎉 All tests passed! System is ready.")
        print("\n📋 Next steps:")
        print("   1. Start API server: python3 api_server.py")
        print("   2. Start frontend: cd ../frontend && npm run dev")
        print("   3. Open http://localhost:5173")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Use provided image path
        test_image_path = sys.argv[1]
        # Update the test to use provided path
        globals()['TEST_IMAGE_PATH'] = test_image_path
    
    sys.exit(main()) 