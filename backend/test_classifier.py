#!/usr/bin/env python3
"""
Test script for the classifier.
"""

import os
from pathlib import Path
from classifier import classify_and_organize_image

def test_classifier():
    """Test the classifier with a sample image."""
    print("Testing classifier...")
    
    # Check if we have any images in stream-test to test with
    stream_test_dir = Path("stream-test")
    if not stream_test_dir.exists():
        print("No stream-test directory found. Please run webcam_capture.py first to capture some test images.")
        return
    
    # Find the most recent image
    image_files = []
    for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
        image_files.extend(stream_test_dir.glob(f'*{ext}'))
        image_files.extend(stream_test_dir.glob(f'*{ext.upper()}'))
    
    if not image_files:
        print("No images found in stream-test directory.")
        return
    
    # Get the most recent image
    latest_image = max(image_files, key=os.path.getmtime)
    print(f"Testing with image: {latest_image}")
    
    # Test classification
    success = classify_and_organize_image(latest_image)
    
    if success:
        print("✅ Classification test passed!")
    else:
        print("❌ Classification test failed!")

if __name__ == "__main__":
    test_classifier()
