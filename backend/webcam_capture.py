#!/usr/bin/env python3
"""
Real-time Webcam Capture with AI Classification
Captures frames from webcam every 2 seconds, classifies them in real-time,
and organizes them into category folders (food ingredients) with automatic cleanup.
"""

import cv2
import os
import time
from datetime import datetime
from pathlib import Path
from .classifier import classify_and_organize_image
from .camera_utils import find_best_camera, test_camera
from .config import SHOW_CAMERA_PREVIEW

def get_timestamp_filename():
    """Generate filename with format YYYYMMDD_HHMMSSmmm"""
    now = datetime.now()
    return now.strftime("%Y%m%d_%H%M%S%f")[:-3]  # Remove last 3 digits to get milliseconds

def main():
    # Configuration
    TEMP_FOLDER = "temp_capture"  # Temporary folder for processing
    CAPTURE_INTERVAL = 2.0  # 2 seconds between captures
    IMAGE_FORMAT = "jpg"
    
    # Create temp folder if it doesn't exist
    os.makedirs(TEMP_FOLDER, exist_ok=True)
    
    # Find the best camera (prioritizing Logitech MXBrio)
    print("🔍 Detecting cameras...")
    camera_index = find_best_camera()
    
    # Test the selected camera
    if not test_camera(camera_index):
        print(f"❌ Selected camera {camera_index} not working, trying alternatives...")
        # Try other common indices
        for backup_index in [0, 1, 2, 3]:
            if test_camera(backup_index):
                camera_index = backup_index
                print(f"✅ Using backup camera {camera_index}")
                break
        else:
            print("❌ No working cameras found!")
            return
    
    # Initialize webcam with selected camera
    cap = cv2.VideoCapture(camera_index)
    
    if not cap.isOpened():
        print(f"❌ Error: Could not open camera {camera_index}")
        return
    
    # Get camera info and verify it's the right one
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    print("🚀 Real-time Webcam Classification Started!")
    print(f"📸 Using camera {camera_index}: {width}x{height} @ {fps:.1f}fps")
    print("📸 Capturing frames every 2 seconds")
    print("🤖 Classifying with Cohere Aya Vision")
    print("📁 Organizing into categories: cheese, pickles, bread, tomatoes, lettuce, meat")
    print("🗑️  Deleting irrelevant images automatically")
    print("📊 Max 10 images per category")
    print("\nPress 'q' to quit")
    print("-" * 50)
    
    # Verify camera is working by taking a test frame
    ret, test_frame = cap.read()
    if ret and test_frame is not None:
        print(f"✅ Camera {camera_index} verified working - frame size: {test_frame.shape}")
    else:
        print(f"❌ Camera {camera_index} test frame failed!")
        cap.release()
        return
    
    last_capture_time = 0
    capture_count = 0
    classified_count = 0
    deleted_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            
            if not ret:
                print(f"❌ Error: Could not read frame from camera {camera_index}")
                
                # Try to reinitialize the camera
                cap.release()
                print(f"🔄 Attempting to reinitialize camera {camera_index}...")
                cap = cv2.VideoCapture(camera_index)
                
                if not cap.isOpened():
                    print(f"❌ Failed to reinitialize camera {camera_index}")
                    break
                else:
                    print(f"✅ Camera {camera_index} reinitialized successfully")
                    continue
            
            current_time = time.time()
            
            # Capture frame every 2 seconds
            if current_time - last_capture_time >= CAPTURE_INTERVAL:
                capture_count += 1
                
                # Verify we're still using the right camera every 10 captures
                if capture_count % 10 == 0:
                    current_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    current_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    current_fps = cap.get(cv2.CAP_PROP_FPS)
                    print(f"🔍 Camera check #{capture_count//10}: {current_width}x{current_height} @ {current_fps:.1f}fps")
                
                # Generate filename with timestamp
                filename = f"{get_timestamp_filename()}.{IMAGE_FORMAT}"
                temp_filepath = os.path.join(TEMP_FOLDER, filename)
                
                # Save the frame to temp folder
                success = cv2.imwrite(temp_filepath, frame)
                
                if success:
                    print(f"📸 Captured #{capture_count}: {filename} (camera {camera_index})")
                    
                    # Real-time classification and organization
                    try:
                        image_path = Path(temp_filepath)
                        success = classify_and_organize_image(image_path)
                        
                        if success:
                            classified_count += 1
                            print(f"✅ Classified and organized: {filename}")
                        else:
                            deleted_count += 1
                            print(f"🗑️  Deleted (irrelevant): {filename}")
                            
                    except Exception as e:
                        print(f"❌ Classification error for {filename}: {e}")
                        # Clean up temp file on error
                        try:
                            image_path.unlink()
                        except:
                            pass
                    
                    # Print stats
                    print(f"📊 Stats: {classified_count} classified, {deleted_count} deleted")
                    print("-" * 30)
                    
                else:
                    print(f"❌ Error: Could not save image {filename}")
                
                last_capture_time = current_time
            
            # Display the frame (optional)
            if SHOW_CAMERA_PREVIEW:
                cv2.imshow('Real-time Classification', frame)
                
                # Check for quit command (only if preview is shown)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            else:
                # If no preview, just check for Ctrl+C
                time.sleep(0.01)  # Small delay to prevent CPU spinning
                
    except KeyboardInterrupt:
        print("\n⏹️  Capture interrupted by user")
    
    finally:
        # Clean up
        cap.release()
        if SHOW_CAMERA_PREVIEW:
            cv2.destroyAllWindows()
        
        # Clean up temp folder
        try:
            import shutil
            shutil.rmtree(TEMP_FOLDER)
        except:
            pass
        
        print("\n🏁 Real-time classification stopped")
        print(f"📊 Final Stats:")
        print(f"   📸 Total captured: {capture_count}")
        print(f"   ✅ Successfully classified: {classified_count}")
        print(f"   🗑️  Deleted (irrelevant): {deleted_count}")
        
        # Show final category contents
        print(f"\n📁 Final category contents:")
        for category in ['cheese', 'pickles', 'bread', 'tomatoes', 'lettuce', 'meat']:
            category_path = Path(f'categories/{category}')
            if category_path.exists():
                images = list(category_path.glob('*.jpg'))
                print(f"   {category}: {len(images)} images")
            else:
                print(f"   {category}: 0 images")

if __name__ == "__main__":
    main()
