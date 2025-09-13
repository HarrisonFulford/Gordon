#!/usr/bin/env python3
"""
Webcam Frame Capture Script
Captures frames from webcam at 1 FPS and saves them with timestamp naming.
Manages the stream-test folder to keep only the 10 most recent images.
"""

import cv2
import os
import time
from datetime import datetime
import glob

def get_timestamp_filename():
    """Generate filename with format YYYYMMDD_HHMMSSmmm"""
    now = datetime.now()
    return now.strftime("%Y%m%d_%H%M%S%f")[:-3]  # Remove last 3 digits to get milliseconds

def cleanup_old_images(folder_path, max_images=10):
    """Keep only the most recent images in the folder"""
    if not os.path.exists(folder_path):
        return
    
    # Get all image files in the folder
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.tiff']
    image_files = []
    
    for ext in image_extensions:
        image_files.extend(glob.glob(os.path.join(folder_path, ext)))
    
    # Sort by modification time (newest first)
    image_files.sort(key=os.path.getmtime, reverse=True)
    
    # Remove excess images (keep only the most recent ones)
    if len(image_files) > max_images:
        for old_file in image_files[max_images:]:
            try:
                os.remove(old_file)
                print(f"Removed old image: {os.path.basename(old_file)}")
            except OSError as e:
                print(f"Error removing {old_file}: {e}")

def main():
    # Configuration
    OUTPUT_FOLDER = "stream-test"
    MAX_IMAGES = 10
    CAPTURE_INTERVAL = 1.0  # 1 second between captures
    IMAGE_FORMAT = "jpg"
    
    # Create output folder if it doesn't exist
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam")
        return
    
    print("Webcam capture started. Press 'q' to quit.")
    print(f"Capturing 1 frame per second to '{OUTPUT_FOLDER}' folder")
    print(f"Keeping only the {MAX_IMAGES} most recent images")
    
    last_capture_time = 0
    
    try:
        while True:
            ret, frame = cap.read()
            
            if not ret:
                print("Error: Could not read frame from webcam")
                break
            
            current_time = time.time()
            
            # Capture frame every second
            if current_time - last_capture_time >= CAPTURE_INTERVAL:
                # Generate filename with timestamp
                filename = f"{get_timestamp_filename()}.{IMAGE_FORMAT}"
                filepath = os.path.join(OUTPUT_FOLDER, filename)
                
                # Save the frame
                success = cv2.imwrite(filepath, frame)
                
                if success:
                    print(f"Captured: {filename}")
                    
                    # Clean up old images to maintain max count
                    cleanup_old_images(OUTPUT_FOLDER, MAX_IMAGES)
                else:
                    print(f"Error: Could not save image {filename}")
                
                last_capture_time = current_time
            
            # Display the frame (optional - you can comment this out if you don't want the preview)
            cv2.imshow('Webcam Feed', frame)
            
            # Check for quit command
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        print("\nCapture interrupted by user")
    
    finally:
        # Clean up
        cap.release()
        cv2.destroyAllWindows()
        print("Webcam capture stopped")

if __name__ == "__main__":
    main()
