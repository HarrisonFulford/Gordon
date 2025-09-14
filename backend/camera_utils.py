#!/usr/bin/env python3
"""
Camera utilities for Gordon webcam capture.
Handles camera detection and selection, prioritizing external cameras like Logitech MXBrio.
"""

import cv2
import subprocess
import re
from typing import List, Dict, Optional


def get_available_cameras() -> List[Dict[str, any]]:
    """Get list of available cameras with their details."""
    cameras = []
    
    try:
        # On macOS, use system_profiler to get detailed camera info
        result = subprocess.run(
            ['system_profiler', 'SPCameraDataType'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            # Parse the output to find cameras
            lines = result.stdout.split('\n')
            current_camera = {}
            
            for line in lines:
                line = line.strip()
                if ':' in line and not line.startswith(' '):
                    # New camera section
                    if current_camera:
                        cameras.append(current_camera)
                    current_camera = {'name': line.replace(':', '').strip()}
                elif 'Model ID:' in line:
                    current_camera['model_id'] = line.split(':', 1)[1].strip()
                elif 'Unique ID:' in line:
                    current_camera['unique_id'] = line.split(':', 1)[1].strip()
            
            # Add the last camera
            if current_camera:
                cameras.append(current_camera)
    
    except Exception as e:
        print(f"Warning: Could not get detailed camera info: {e}")
    
    # Test OpenCV camera indices
    opencv_cameras = []
    for i in range(10):  # Test first 10 indices
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            # Try to read a frame to verify camera works
            ret, frame = cap.read()
            if ret and frame is not None:
                # Get camera properties
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                
                opencv_cameras.append({
                    'index': i,
                    'width': width,
                    'height': height,
                    'fps': fps,
                    'working': True
                })
        cap.release()
    
    return {
        'system_cameras': cameras,
        'opencv_cameras': opencv_cameras
    }


def find_best_camera() -> int:
    """Find the best camera based on configuration and available options."""
    from .config import PREFERRED_CAMERA
    
    print("🔍 Searching for cameras...")
    
    # If specific index is configured, use it
    if PREFERRED_CAMERA.isdigit():
        index = int(PREFERRED_CAMERA)
        if test_camera(index):
            print(f"✅ Using configured camera index {index}")
            return index
        else:
            print(f"❌ Configured camera {index} not working, falling back to auto-detection")
    
    camera_info = get_available_cameras()
    
    # Print available cameras
    print("\n📸 Available cameras:")
    for cam in camera_info['system_cameras']:
        name = cam.get('name', 'Unknown')
        model = cam.get('model_id', 'Unknown model')
        print(f"   - {name} ({model})")
    
    print(f"\n🎥 OpenCV camera indices:")
    for cam in camera_info['opencv_cameras']:
        print(f"   - Index {cam['index']}: {cam['width']}x{cam['height']} @ {cam['fps']:.1f}fps")
    
    # Look for Logitech cameras (MXBrio priority)
    logitech_cameras = []
    for cam in camera_info['system_cameras']:
        name = cam.get('name', '').lower()
        if 'logitech' in name or 'mxbrio' in name or 'brio' in name:
            logitech_cameras.append(cam.get('name', ''))
            print(f"✅ Found Logitech camera: {cam.get('name', '')}")
    
    # If Logitech cameras found, select the best OpenCV index
    if logitech_cameras:
        # Prioritize high-resolution cameras (MXBrio should be 1920x1080 or better)
        high_res_cameras = [cam for cam in camera_info['opencv_cameras'] 
                           if cam['width'] >= 1920 and cam['height'] >= 1080]
        
        if high_res_cameras:
            # Select the one with highest FPS
            best_camera = max(high_res_cameras, key=lambda x: x['fps'])
            index = best_camera['index']
            print(f"🎯 Selected Logitech MXBrio at index {index} ({best_camera['width']}x{best_camera['height']} @ {best_camera['fps']:.1f}fps)")
            return index
        
        # Fallback: use highest index (likely external camera)
        if camera_info['opencv_cameras']:
            highest_index = max(camera_info['opencv_cameras'], key=lambda x: x['index'])['index']
            print(f"🎯 Using highest index camera: {highest_index}")
            return highest_index
    
    # No Logitech found, use best available camera
    if camera_info['opencv_cameras']:
        # Prefer higher resolution and FPS
        best_camera = max(camera_info['opencv_cameras'], 
                         key=lambda x: (x['width'] * x['height'], x['fps']))
        index = best_camera['index']
        print(f"🎯 Using best available camera at index {index} ({best_camera['width']}x{best_camera['height']})")
        return index
    
    print("❌ No working cameras found, using default (0)")
    return 0


# Keep the old function for backward compatibility
def find_logitech_camera() -> Optional[int]:
    """Find the Logitech camera index, prioritizing MXBrio."""
    return find_best_camera()


def test_camera(camera_index: int) -> bool:
    """Test if a camera index works properly."""
    try:
        cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            return False
        
        # Try to read a frame
        ret, frame = cap.read()
        cap.release()
        
        return ret and frame is not None
    except:
        return False


if __name__ == "__main__":
    print("🧪 Testing Camera Detection")
    print("=" * 50)
    
    # Get available cameras
    camera_info = get_available_cameras()
    
    # Find Logitech camera
    logitech_index = find_logitech_camera()
    
    print(f"\n🎯 Selected camera index: {logitech_index}")
    
    # Test the selected camera
    if test_camera(logitech_index):
        print(f"✅ Camera {logitech_index} is working!")
    else:
        print(f"❌ Camera {logitech_index} failed test")
    
    print("\n✅ Camera detection test completed!") 