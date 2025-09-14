#!/usr/bin/env python3
"""
Cohere-based image classification script.

Uses Cohere's Aya Vision model to classify food images.
"""

import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Any

import cohere
import pandas as pd
from PIL import Image
from tqdm import tqdm

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config import (
    COHERE_API_KEY, COHERE_MODEL, CLASSES, MAX_IMAGE_SIZE, 
    SUPPORTED_FORMATS, RESULTS_DIR, MAX_RETRIES, REQUEST_TIMEOUT
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


def classify_image_with_cohere(client: cohere.Client, image_path: Path) -> Dict[str, Any]:
    """Classify a single image using Cohere Aya Vision API."""
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
    
    # Create classification prompt
    classes_str = ', '.join(CLASSES)
    prompt = f"""Look at this image and classify it as one of these food categories: {classes_str}

Return your response as JSON with this exact format:
{{
    "predicted_class": "one_of_the_categories",
    "confidence": 0.95,
    "reasoning": "brief explanation of why you chose this category",
    "all_scores": {{
        "pizza": 0.1,
        "club_sandwich": 0.8
    }}
}}

Be precise and only use the exact category names provided."""
    
    # Make API call with retries
    for attempt in range(MAX_RETRIES):
        try:
            # Use the v2 API for Aya Vision models
            v2_client = client.v2
            response = v2_client.chat(
                model=COHERE_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_base64}}
                        ]
                    }
                ],
                max_tokens=500,
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
                    # Fallback: create basic response
                    predictions = {
                        'predicted_class': 'unknown',
                        'confidence': 0.0,
                        'reasoning': 'Could not parse response',
                        'all_scores': {cls: 0.0 for cls in CLASSES}
                    }
            except json.JSONDecodeError:
                # Fallback response
                predictions = {
                    'predicted_class': 'unknown',
                    'confidence': 0.0,
                    'reasoning': f'JSON parse error: {response_text[:100]}',
                    'all_scores': {cls: 0.0 for cls in CLASSES}
                }
            
            return {
                'image_path': str(image_path),
                'error': None,
                'predictions': predictions
            }
            
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                print(f"Attempt {attempt + 1} failed for {image_path.name}: {e}")
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                return {
                    'image_path': str(image_path),
                    'error': str(e),
                    'predictions': None
                }
    
    # Clean up temp file if created
    if processed_image_path != image_path and processed_image_path.exists():
        processed_image_path.unlink()


def classify_folder(folder_path: str, output_path: str) -> pd.DataFrame:
    """Classify all images in a folder."""
    # Initialize Cohere client
    if not COHERE_API_KEY or COHERE_API_KEY == 'your_cohere_api_key_here':
        raise ValueError("Cohere API key not configured. Please set COHERE_API_KEY in .env file")
    
    client = cohere.Client(COHERE_API_KEY)
    
    # Ensure results directory exists
    Path(RESULTS_DIR).mkdir(parents=True, exist_ok=True)
    
    # Find all images recursively
    folder = Path(folder_path)
    if not folder.exists():
        raise ValueError(f"Folder not found: {folder_path}")
    
    image_files = []
    for ext in SUPPORTED_FORMATS:
        # Search recursively in subdirectories
        image_files.extend(folder.rglob(f'*{ext}'))
        image_files.extend(folder.rglob(f'*{ext.upper()}'))
    
    if not image_files:
        raise ValueError(f"No images found in folder: {folder_path}")
    
    print(f"Found {len(image_files)} images to classify")
    
    # Classify images
    results = []
    for img_path in tqdm(image_files, desc="Classifying images"):
        result = classify_image_with_cohere(client, img_path)
        results.append(result)
        
        # Small delay to avoid rate limits
        time.sleep(0.5)
    
    # Convert to DataFrame
    df_data = []
    for result in results:
        row = {
            'image_path': result['image_path'],
            'image_name': Path(result['image_path']).name,
            'error': result['error']
        }
        
        if result['predictions']:
            pred = result['predictions']
            row.update({
                'predicted_class': pred.get('predicted_class', 'unknown'),
                'confidence': pred.get('confidence', 0.0),
                'reasoning': pred.get('reasoning', ''),
            })
            
            # Add individual class scores
            all_scores = pred.get('all_scores', {})
            for cls in CLASSES:
                row[f'score_{cls}'] = all_scores.get(cls, 0.0)
        else:
            row.update({
                'predicted_class': 'error',
                'confidence': 0.0,
                'reasoning': 'Classification failed',
            })
            for cls in CLASSES:
                row[f'score_{cls}'] = 0.0
        
        df_data.append(row)
    
    # Create DataFrame and save
    df = pd.DataFrame(df_data)
    df.to_csv(output_path, index=False)
    
    # Print summary
    print(f"\nClassification Summary:")
    print(f"Total images: {len(df)}")
    print(f"Successful: {len(df[df['error'].isna()])}")
    print(f"Failed: {len(df[df['error'].notna()])}")
    
    if len(df[df['error'].isna()]) > 0:
        print(f"\nPredictions by class:")
        pred_counts = df[df['error'].isna()]['predicted_class'].value_counts()
        for cls, count in pred_counts.items():
            print(f"  {cls}: {count}")
    
    return df


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Classify images using Cohere Aya Vision")
    parser.add_argument("folder", help="Path to folder containing images")
    parser.add_argument("--output", "-o", help="Output CSV file path")
    parser.add_argument("--api-key", help="Cohere API key (overrides .env)")
    args = parser.parse_args()
    
    # Override API key if provided
    if args.api_key:
        global COHERE_API_KEY
        COHERE_API_KEY = args.api_key
    
    # Set default output file
    if not args.output:
        folder_name = Path(args.folder).name
        args.output = f"{RESULTS_DIR}/classifications_{folder_name}.csv"
    
    try:
        df = classify_folder(args.folder, args.output)
        print(f"\nClassification completed successfully!")
        print(f"Results saved to: {args.output}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
