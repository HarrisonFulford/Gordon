#!/usr/bin/env python3
"""
Real-time image classification using Cohere Aya Vision.
Optimized for speed and strict classification.
"""

import base64
import json
import os
import time
from pathlib import Path
from typing import Dict, Any, Optional

import cohere
from PIL import Image

from backend.config import (
    COHERE_API_KEY, COHERE_MODEL, CLASSES, MAX_IMAGE_SIZE, 
    SUPPORTED_FORMATS, CATEGORIES_DIR, MAX_IMAGES_PER_CATEGORY,
    MAX_RETRIES, REQUEST_TIMEOUT
)


def encode_image_to_base64(image_path: Path) -> str:
    """Convert image to base64 data URL for API."""
    try:
        _, file_extension = os.path.splitext(image_path)
        file_type = file_extension[1:] if file_extension else 'jpg'
        
        with open(image_path, 'rb') as f:
            enc_img = base64.b64encode(f.read()).decode('utf-8')
            return f"data:image/{file_type};base64,{enc_img}"
    except Exception as e:
        print(f"Error encoding image {image_path}: {e}")
        return None


def resize_image_if_needed(image_path: Path) -> Path:
    """Resize image if it's too large for efficient API calls."""
    try:
        with Image.open(image_path) as img:
            if img.size[0] > MAX_IMAGE_SIZE[0] or img.size[1] > MAX_IMAGE_SIZE[1]:
                img.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
                # Save resized image to temp location
                temp_path = image_path.parent / f"temp_{image_path.name}"
                img.save(temp_path, quality=85)
                return temp_path
        return image_path
    except Exception as e:
        print(f"Error resizing image {image_path}: {e}")
        return image_path


class RealTimeClassifier:
    """Optimized classifier for real-time processing."""
    
    def __init__(self):
        if not COHERE_API_KEY or COHERE_API_KEY == 'your_cohere_api_key_here':
            raise ValueError("Cohere API key not configured. Please set COHERE_API_KEY in .env file")
        
        self.client = cohere.Client(COHERE_API_KEY)
        self.v2_client = self.client.v2
        
        # Create the system prompt once
        classes_str = ', '.join(CLASSES)
        self.system_prompt = f"""You are a strict image classifier. Look at each image and classify it as EXACTLY one of these categories: {classes_str}

CRITICAL RULES:
1. Only classify if the image CLEARLY shows one of these objects
2. Be VERY strict - if unsure, classify as "irrelevant"
3. Return ONLY JSON in this exact format:
{{"class": "category_name_or_irrelevant", "confidence": 0.95}}

Valid responses:
- {{"class": "chair", "confidence": 0.9}}
- {{"class": "door", "confidence": 0.8}}
- {{"class": "irrelevant", "confidence": 0.7}}

NO explanations, NO reasoning, NO extra text - just the JSON."""

    def classify_image(self, image_path: Path) -> Dict[str, Any]:
        """Classify a single image - optimized for speed."""
        # Resize image if needed
        processed_image_path = resize_image_if_needed(image_path)
        
        # Encode image
        image_base64 = encode_image_to_base64(processed_image_path)
        if not image_base64:
            return {
                'image_path': str(image_path),
                'error': 'Failed to encode image',
                'predictions': None
            }
        
        # Make API call with retries
        for attempt in range(MAX_RETRIES):
            try:
                response = self.v2_client.chat(
                    model=COHERE_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": self.system_prompt
                        },
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": image_base64}}
                            ]
                        }
                    ],
                    max_tokens=50,  # Minimal tokens for speed
                    temperature=0.1
                )
                
                # Parse response
                response_text = response.message.content[0].text.strip()
                
                # Try to extract JSON from response
                try:
                    # Look for JSON in the response
                    start_idx = response_text.find('{')
                    end_idx = response_text.rfind('}') + 1
                    if start_idx != -1 and end_idx > start_idx:
                        json_str = response_text[start_idx:end_idx]
                        predictions = json.loads(json_str)
                    else:
                        predictions = {"class": "irrelevant", "confidence": 0.0}
                except json.JSONDecodeError:
                    predictions = {"class": "irrelevant", "confidence": 0.0}
                
                return {
                    'image_path': str(image_path),
                    'error': None,
                    'predictions': predictions
                }
                
            except Exception as e:
                if attempt < MAX_RETRIES - 1:
                    time.sleep(0.5)  # Short delay for retry
                else:
                    return {
                        'image_path': str(image_path),
                        'error': str(e),
                        'predictions': None
                    }
        
        # Clean up temp file if created
        if processed_image_path != image_path and processed_image_path.exists():
            processed_image_path.unlink()


def cleanup_category_folder(category_path: Path, max_images: int = MAX_IMAGES_PER_CATEGORY):
    """Keep only the most recent images in the category folder."""
    if not category_path.exists():
        return
    
    # Get all image files in the folder
    image_files = []
    for ext in SUPPORTED_FORMATS:
        image_files.extend(category_path.glob(f'*{ext}'))
        image_files.extend(category_path.glob(f'*{ext.upper()}'))
    
    # Sort by modification time (newest first)
    image_files.sort(key=os.path.getmtime, reverse=True)
    
    # Remove excess images (keep only the most recent ones)
    if len(image_files) > max_images:
        for old_file in image_files[max_images:]:
            try:
                old_file.unlink()
                print(f"🗑️  Removed old image: {old_file.name}")
            except OSError as e:
                print(f"Error removing {old_file}: {e}")


# Global classifier instance for efficiency
_classifier_instance = None

def get_classifier():
    """Get or create the global classifier instance."""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = RealTimeClassifier()
    return _classifier_instance


def classify_and_organize_image(image_path: Path) -> bool:
    """Classify an image and organize it into the appropriate category folder."""
    classifier = get_classifier()
    
    # Classify the image
    result = classifier.classify_image(image_path)
    
    if result['error']:
        print(f"❌ Classification failed: {result['error']}")
        return False
    
    predictions = result['predictions']
    if not predictions:
        print(f"❌ No predictions returned")
        return False
    
    # Get predicted class
    predicted_class = predictions.get('class', 'irrelevant')
    confidence = predictions.get('confidence', 0.0)
    
    # Check if image is irrelevant
    if predicted_class == 'irrelevant' or confidence < 0.5:
        print(f"🗑️  Irrelevant (confidence: {confidence:.2f})")
        try:
            image_path.unlink()
        except OSError as e:
            print(f"Error deleting irrelevant image: {e}")
        return False
    
    # Check if predicted class is valid
    if predicted_class not in CLASSES:
        print(f"❌ Invalid class '{predicted_class}' - deleting")
        try:
            image_path.unlink()
        except OSError as e:
            print(f"Error deleting image with invalid class: {e}")
        return False
    
    print(f"✅ {predicted_class} (confidence: {confidence:.2f})")
    
    # Create category folder if it doesn't exist
    category_path = Path(CATEGORIES_DIR) / predicted_class
    category_path.mkdir(parents=True, exist_ok=True)
    
    # Move image to category folder
    new_path = category_path / image_path.name
    try:
        image_path.rename(new_path)
        
        # Clean up category folder to maintain max count
        cleanup_category_folder(category_path)
        
        return True
        
    except OSError as e:
        print(f"❌ Error moving image: {e}")
        return False


if __name__ == "__main__":
    # Test the classifier with a single image
    import sys
    if len(sys.argv) != 2:
        print("Usage: python classifier.py <image_path>")
        sys.exit(1)
    
    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(f"Image not found: {image_path}")
        sys.exit(1)
    
    success = classify_and_organize_image(image_path)
    if success:
        print("✅ Classification and organization completed!")
    else:
        print("❌ Classification or organization failed!")
