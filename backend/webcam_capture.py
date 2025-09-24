#!/usr/bin/env python3
"""
Real-time Webcam Capture with AI Classification
Captures frames from webcam every 2 seconds, classifies them in real-time,
and organizes them into category folders (chair/door) with automatic cleanup.
"""

import cv2
import os
import time
from datetime import datetime
from pathlib import Path
from .classifier import classify_and_organize_image

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
    
    # Initialize webcam
    cap = cv2.VideoCapture(1)
    
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return
    
    print("🚀 Real-time Webcam Classification Started!")
    print("📸 Capturing frames every 2 seconds")
    print("🤖 Classifying with Cohere Aya Vision")
    print("📁 Organizing into categories: chair, door")
    print("🗑️  Deleting irrelevant images automatically")
    print("📊 Max 10 images per category")
    print("\nPress 'q' to quit")
    print("-" * 50)
    
    last_capture_time = 0
    capture_count = 0
    classified_count = 0
    deleted_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            
            if not ret:
                print("Error: Could not read frame from webcam")
                break
            
            current_time = time.time()
            
            # Capture frame every 2 seconds
            if current_time - last_capture_time >= CAPTURE_INTERVAL:
                capture_count += 1
                
                # Generate filename with timestamp
                filename = f"{get_timestamp_filename()}.{IMAGE_FORMAT}"
                temp_filepath = os.path.join(TEMP_FOLDER, filename)
                
                # Save the frame to temp folder
                success = cv2.imwrite(temp_filepath, frame)
                
                if success:
                    print(f"📸 Captured #{capture_count}: {filename}")
                    
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
            
            # Display the frame
            cv2.imshow('Real-time Classification', frame)
            
            # Check for quit command
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        print("\n⏹️  Capture interrupted by user")
    
    finally:
        # Clean up
        cap.release()
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
        for category in ['chair', 'door']:
            category_path = Path(f'categories/{category}')
            if category_path.exists():
                images = list(category_path.glob('*.jpg'))
                print(f"   {category}: {len(images)} images")
            else:
                print(f"   {category}: 0 images")

if __name__ == "__main__":
    main()
