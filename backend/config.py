"""
Configuration for Cohere-based image classification.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Cohere API Configuration
COHERE_API_KEY = os.getenv('COHERE_API_KEY')
COHERE_MODEL = os.getenv('COHERE_MODEL', 'c4ai-aya-vision-8b')

# ElevenLabs API Configuration
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
GORDON_VOICE_ID = os.getenv('GORDON_VOICE_ID', '2qkO9rb42qS5jRK9294E')  # Default Gordon voice ID

# Classification settings
CLASSES = [
    "chair",
    "door"
]

# Image settings
MAX_IMAGE_SIZE = (512, 512)  # Resize images for API efficiency
SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

# Output settings
CATEGORIES_DIR = "categories"
RESULTS_DIR = "results"
MAX_IMAGES_PER_CATEGORY = 10

# API settings
MAX_RETRIES = 3
REQUEST_TIMEOUT = 30
BATCH_SIZE = 5  # Process images in batches to avoid rate limits
