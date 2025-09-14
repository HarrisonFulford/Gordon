#!/usr/bin/env python3
"""
Flask API Server for Gordon - Real-time Cooking Assistant
Connects the React frontend to the Python backend services.
"""

import os
import subprocess
import threading
import time
from pathlib import Path
from typing import Optional

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from backend.recipe_generator import get_recipe_generator
from backend.gordon_quotes import generate_gordon_quotes_for_session
from backend.config import CATEGORIES_DIR, SUPPORTED_FORMATS
from backend.tts_service import get_quote_scheduler

app = Flask(__name__)
CORS(app)  # Enable CORS for React development

# Configuration
UPLOAD_FOLDER = 'temp_uploads'
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}

# Global state
webcam_process: Optional[subprocess.Popen] = None
session_active = False
current_session_id = None
session_start_time = None

# Get TTS scheduler instance
quote_scheduler = get_quote_scheduler()

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CATEGORIES_DIR, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed."""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def get_category_stats():
    """Get current category statistics."""
    stats = {}
    categories_path = Path(CATEGORIES_DIR)
    
    if categories_path.exists():
        for category_dir in categories_path.iterdir():
            if category_dir.is_dir():
                # Count images in category
                image_count = 0
                latest_image = None
                latest_time = 0
                
                for ext in SUPPORTED_FORMATS:
                    images = list(category_dir.glob(f'*{ext}')) + list(category_dir.glob(f'*{ext.upper()}'))
                    image_count += len(images)
                    
                    # Find latest image
                    for img in images:
                        if img.stat().st_mtime > latest_time:
                            latest_time = img.stat().st_mtime
                            latest_image = img.name
                
                stats[category_dir.name] = {
                    'count': image_count,
                    'latest': latest_image,
                    'latest_time': latest_time
                }
    
    return stats


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'session_active': session_active,
        'webcam_running': webcam_process is not None and webcam_process.poll() is None
    })


@app.route('/api/recipes/generate', methods=['POST'])
def generate_recipes():
    """Generate recipes from uploaded ingredient image."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Please upload an image.'}), 400
    
    try:
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        unique_filename = f"{timestamp}_{filename}"
        filepath = Path(UPLOAD_FOLDER) / unique_filename
        
        file.save(filepath)
        
        # Generate recipes
        recipe_generator = get_recipe_generator()
        result = recipe_generator.generate_recipes_from_image(filepath)
        
        # Clean up uploaded file
        filepath.unlink()
        
        if result.get('error'):
            return jsonify({'error': result['error']}), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Recipe generation failed: {str(e)}'}), 500


@app.route('/api/session/start', methods=['POST'])
def start_session():
    """Start a cooking session (starts webcam capture and generates Gordon quotes with TTS)."""
    global webcam_process, session_active, current_session_id, session_start_time
    
    try:
        # Check if already running
        if webcam_process and webcam_process.poll() is None:
            return jsonify({
                'status': 'already_running',
                'message': 'Webcam capture is already active'
            })
        
        # Get timeline and session info from request body (sent from frontend)
        request_data = request.json or {}
        timeline = request_data.get('timeline', [])
        session_id = request_data.get('session_id', f'session_{int(time.time())}')
        
        # Generate Gordon Ramsay quotes for the timeline
        quotes = []
        if timeline:
            try:
                quotes = generate_gordon_quotes_for_session(timeline)
                print(f"Generated {len(quotes)} Gordon quotes for session")
            except Exception as e:
                print(f"Error generating Gordon quotes: {e}")
                # Continue without quotes if generation fails
        
        # Start webcam capture process
        webcam_process = subprocess.Popen(
            ['python3', '-m', 'backend.webcam_capture'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Run from Gordon root
        )
        
        # Record session start time
        session_start_time = time.time()
        current_session_id = session_id
        session_active = True
        
        # Start TTS quote scheduler if quotes are available
        if quotes and quote_scheduler.tts_service.is_initialized:
            try:
                quote_scheduler.start_session(session_id, quotes, session_start_time)
                print(f"✅ Started TTS quote scheduler for session {session_id}")
            except Exception as e:
                print(f"❌ Failed to start TTS quote scheduler: {e}")
        
        return jsonify({
            'status': 'started',
            'message': 'Webcam capture started successfully',
            'pid': webcam_process.pid,
            'session_id': session_id,
            'quotes_generated': len(quotes),
            'quotes': quotes,
            'tts_enabled': quote_scheduler.tts_service.is_initialized
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': f'Failed to start session: {str(e)}'
        }), 500

@app.route('/api/session/stop', methods=['POST'])
def stop_session():
    """Stop the cooking session (stops webcam capture and TTS)."""
    global webcam_process, session_active, current_session_id, session_start_time
    
    try:
        # Stop TTS quote scheduler if active
        if current_session_id:
            try:
                quote_scheduler.stop_session(current_session_id)
                print(f"✅ Stopped TTS quote scheduler for session {current_session_id}")
            except Exception as e:
                print(f"❌ Failed to stop TTS quote scheduler: {e}")
        
        if webcam_process:
            # Terminate the process
            webcam_process.terminate()
            
            # Wait for process to end (with timeout)
            try:
                webcam_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if it doesn't terminate gracefully
                webcam_process.kill()
                webcam_process.wait()
            
            webcam_process = None
        
        session_active = False
        current_session_id = None
        session_start_time = None
        
        return jsonify({
            'status': 'stopped',
            'message': 'Webcam capture and TTS stopped successfully'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': f'Failed to stop session: {str(e)}'
        }), 500


@app.route('/api/session/status', methods=['GET'])
def session_status():
    """Get current session status."""
    is_running = webcam_process is not None and webcam_process.poll() is None
    
    return jsonify({
        'session_active': session_active,
        'webcam_running': is_running,
        'pid': webcam_process.pid if is_running else None,
        'session_id': current_session_id,
        'session_start_time': session_start_time,
        'tts_enabled': quote_scheduler.tts_service.is_initialized,
        'categories': get_category_stats()
    })


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories with their current stats."""
    return jsonify({
        'categories': get_category_stats()
    })


@app.route('/api/categories/<category>/images', methods=['GET'])
def get_category_images(category):
    """Get all images for a specific category."""
    category_path = Path(CATEGORIES_DIR) / category
    
    if not category_path.exists():
        return jsonify({
            'category': category,
            'images': [],
            'count': 0
        })
    
    images = []
    for ext in SUPPORTED_FORMATS:
        for image_file in category_path.glob(f'*{ext}'):
            images.append({
                'filename': image_file.name,
                'path': f'/api/categories/{category}/image/{image_file.name}',
                'modified': image_file.stat().st_mtime
            })
        for image_file in category_path.glob(f'*{ext.upper()}'):
            images.append({
                'filename': image_file.name,
                'path': f'/api/categories/{category}/image/{image_file.name}',
                'modified': image_file.stat().st_mtime
            })
    
    # Sort by modification time (newest first)
    images.sort(key=lambda x: x['modified'], reverse=True)
    
    return jsonify({
        'category': category,
        'images': images,
        'count': len(images)
    })


@app.route('/api/categories/<category>/image/<filename>', methods=['GET'])
def serve_category_image(category, filename):
    """Serve an image from a category folder."""
    category_path = Path(CATEGORIES_DIR) / category
    
    if not category_path.exists():
        return "Category not found", 404
    
    image_path = category_path / filename
    if not image_path.exists():
        return "Image not found", 404
    
    return send_from_directory(category_path, filename)


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({'error': 'File too large. Maximum size is 16MB.'}), 413


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors."""
    return jsonify({'error': 'Internal server error'}), 500


def cleanup_on_exit():
    """Clean up processes when server shuts down."""
    global webcam_process
    
    # Stop all TTS sessions
    try:
        quote_scheduler.cleanup_all_sessions()
        print("✅ Cleaned up TTS sessions")
    except Exception as e:
        print(f"❌ Error cleaning up TTS sessions: {e}")
    
    # Stop webcam process
    if webcam_process:
        try:
            webcam_process.terminate()
            webcam_process.wait(timeout=5)
        except:
            try:
                webcam_process.kill()
                webcam_process.wait()
            except:
                pass


if __name__ == '__main__':
    import atexit
    atexit.register(cleanup_on_exit)
    
    print("🚀 Gordon API Server Starting...")
    print("📸 Recipe Generation: /api/recipes/generate")
    print("🎬 Session Control: /api/session/start|stop|status")
    print("📁 Categories: /api/categories")
    print("🔗 Health Check: /api/health")
    print("-" * 50)
    
    # Configure Flask
    app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
    
    # Run server
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True,
        threaded=True
    ) 