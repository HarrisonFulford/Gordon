#!/usr/bin/env python3
"""
Recipe Generation Service using Cohere Aya Vision.
Analyzes ingredient images and generates recipes with cooking timelines.
"""

import base64
import json
import os
from pathlib import Path
from typing import List, Dict, Any

import cohere
from PIL import Image

from backend.config import (
    COHERE_API_KEY, COHERE_MODEL, MAX_IMAGE_SIZE, 
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


class RecipeGenerator:
    """Generates recipes from ingredient images using Cohere Aya Vision."""
    
    def __init__(self):
        if not COHERE_API_KEY or COHERE_API_KEY == 'your_cohere_api_key_here':
            raise ValueError("Cohere API key not configured. Please set COHERE_API_KEY in .env file")
        
        self.client = cohere.Client(COHERE_API_KEY)
        self.v2_client = self.client.v2
        
        # Recipe generation prompt
        self.recipe_prompt = """Look at this image of ingredients and suggest 2-5 realistic recipes I can make with what's visible.

Analyze the ingredients carefully and create specific, detailed cooking steps that are appropriate for those exact ingredients. Do NOT use generic placeholder steps.

Return ONLY JSON in this EXACT format (no extra text):
{
  "recipes": [
    {
      "id": "recipe-slug-name",
      "name": "Recipe Name",
      "description": "Brief appetizing description in one sentence",
      "cookTime": 1-120,
      "servings": 1-4,
      "difficulty": "Easy | Medium | Hard",
      "category": "cuisine type",
      "ingredients": ["ingredient1", "ingredient2", "ingredient3", ..., "ingredientN"],
      "timeline": [
        {
          "id": "step-1",
          "tStart": 0,
          "tEnd": 300,
          "type": "instruction",
          "text": "Specific prep step for these exact ingredients",
          "category": "prep"
        },
        {
          ...
        },
        {
          "id": "step-N",
          "tStart": 600,
          "tEnd": 900,
          "type": "progress",
          "text": "Specific monitoring step for this dish",
          "category": "cook"
        },
        {
          "id": "step-final",
          "tStart": 900,
          "tEnd": 1500,
          "type": "end",
          "text": "Specific finishing step for this dish",
          "category": "finish"
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Timeline must span exactly the cookTime duration (in seconds) - convert cookTime minutes to seconds for tStart/tEnd
2. Create SPECIFIC cooking steps based on the actual ingredients visible in the image, each step should be more than 2 minutes long
3. Each step should be detailed and actionable (e.g., "Dice the onions into 1/4 inch pieces" not "Prep ingredients")
4. Include realistic timing for each step based on the cooking method and ingredients
5. Include prep, cooking, and finishing steps with proper sequencing
6. difficulty must be: "Easy", "Medium", or "Hard"
7. type must be: "instruction", "progress", or "end"
8. Only suggest recipes possible with visible ingredients
9. Ensure tEnd of final step equals cookTime * 60 (total seconds)
10. Make steps specific to the dish being made (e.g., "Sear the chicken breast for 4 minutes per side" not "Cook the meat")
11. Include proper cooking techniques for the specific ingredients (e.g., "Sauté the garlic until fragrant" not "Heat the pan")
12. Include AT LEAST 1 step of each type (progress, instruction, end)"""
    def generate_recipes_from_image(self, image_path: Path) -> Dict[str, Any]:
        """Generate recipes from an ingredient image."""
        # Resize image if needed
        processed_image_path = resize_image_if_needed(image_path)
        
        # Encode image
        image_base64 = encode_image_to_base64(processed_image_path)
        if not image_base64:
            return {
                'error': 'Failed to encode image',
                'recipes': []
            }
        
        # Make API call with retries
        for attempt in range(MAX_RETRIES):
            try:
                response = self.v2_client.chat(
                    model=COHERE_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": self.recipe_prompt
                        },
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": image_base64}}
                            ]
                        }
                    ],
                    max_tokens=2000,  # More tokens for recipe generation
                    temperature=0.3   # Some creativity but stay focused
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
                        recipes_data = json.loads(json_str)
                        
                        # Validate the response structure
                        if 'recipes' in recipes_data and isinstance(recipes_data['recipes'], list):
                            return recipes_data
                        else:
                            raise ValueError("Invalid response structure")
                    else:
                        raise ValueError("No JSON found in response")
                        
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"JSON parsing error: {e}")
                    print(f"Response text: {response_text[:200]}...")
                    
                    # Fallback response
                    return {
                        'error': f'Failed to parse recipe response: {str(e)}',
                        'recipes': []
                    }
                
            except Exception as e:
                if attempt < MAX_RETRIES - 1:
                    print(f"Attempt {attempt + 1} failed: {e}")
                    import time
                    time.sleep(1)  # Brief delay before retry
                else:
                    return {
                        'error': f'Recipe generation failed: {str(e)}',
                        'recipes': []
                    }
        
        # Clean up temp file if created
        if processed_image_path != image_path and processed_image_path.exists():
            processed_image_path.unlink()
        
        return {
            'error': 'Maximum retries exceeded',
            'recipes': []
        }


# Global recipe generator instance
_recipe_generator_instance = None

def get_recipe_generator():
    """Get or create the global recipe generator instance."""
    global _recipe_generator_instance
    if _recipe_generator_instance is None:
        _recipe_generator_instance = RecipeGenerator()
    return _recipe_generator_instance


if __name__ == "__main__":
    # Test the recipe generator with a single image
    import sys
    if len(sys.argv) != 2:
        print("Usage: python recipe_generator.py <image_path>")
        sys.exit(1)
    
    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(f"Image not found: {image_path}")
        sys.exit(1)
    
    generator = get_recipe_generator()
    result = generator.generate_recipes_from_image(image_path)
    
    if result.get('error'):
        print(f"❌ Error: {result['error']}")
    else:
        recipes = result.get('recipes', [])
        print(f"✅ Generated {len(recipes)} recipes:")
        for recipe in recipes:
            print(f"  - {recipe['name']} ({recipe['cookTime']} min, {recipe['difficulty']})") 