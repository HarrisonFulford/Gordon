#!/usr/bin/env python3
"""
Text-to-Speech Service using ElevenLabs API with custom Gordon voice.
Uses subprocess to call the working voice-testing implementation.
"""

import os
import subprocess
import threading
import time
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

from backend.config import ELEVENLABS_API_KEY, GORDON_VOICE_ID

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to the working voice-testing directory
VOICE_TESTING_DIR = Path(__file__).parent.parent.parent / "voice-testing"


class TTSService:
    """Text-to-Speech service for Gordon cooking assistant using voice-testing subprocess."""
    
    def __init__(self):
        self.is_initialized = False
        self.temp_audio_dir = Path(tempfile.gettempdir()) / "gordon_tts"
        self.temp_audio_dir.mkdir(exist_ok=True)
        
        # Initialize the service
        self._initialize()
    
    def _initialize(self):
        """Initialize TTS service by checking voice-testing availability."""
        try:
            if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY == 'your_api_key_here':
                logger.warning("ElevenLabs API key not configured. TTS will be disabled.")
                return
            
            if not VOICE_TESTING_DIR.exists():
                logger.warning(f"voice-testing directory not found at {VOICE_TESTING_DIR}. TTS will be disabled.")
                return
            
            # Test if voice-testing works in its own environment
            result = self._test_voice_testing()
            if result:
                self.is_initialized = True
                logger.info("✅ TTS Service initialized using voice-testing subprocess")
            else:
                logger.error("❌ voice-testing test failed. TTS will be disabled.")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize TTS service: {e}")
    
    def _test_voice_testing(self) -> bool:
        """Test if voice-testing works by running in its own environment."""
        try:
            # Test using voice-testing's own virtual environment
            venv_python = VOICE_TESTING_DIR / "venv" / "bin" / "python"
            
            if not venv_python.exists():
                logger.error(f"voice-testing venv not found at {venv_python}")
                return False
            
            # Run the test_setup.py in voice-testing's own environment
            result = subprocess.run(
                [str(venv_python), "test_setup.py"],
                cwd=VOICE_TESTING_DIR,
                capture_output=True,
                text=True,
                timeout=15
            )
            
            # Check if the test passed
            success = result.returncode == 0 and "Setup test completed successfully" in result.stdout
            if success:
                logger.info("✅ voice-testing setup test passed in its own environment")
            else:
                logger.error(f"❌ voice-testing setup test failed: {result.stdout} {result.stderr}")
            
            return success
            
        except Exception as e:
            logger.error(f"Voice-testing test failed: {e}")
            return False
    
    def play_audio_immediately(self, text: str) -> bool:
        """Play audio immediately using voice-testing in its own environment."""
        if not self.is_initialized:
            logger.warning("TTS service not initialized. Skipping audio playback.")
            return False
        
        try:
            logger.info(f"🔊 Gordon is speaking: '{text[:50]}...'")
            
            # Use voice-testing's own virtual environment
            venv_python = VOICE_TESTING_DIR / "venv" / "bin" / "python"
            
            # Create a simple script to play the text
            play_script = f'''
from tts_gordon import load_api_key, get_gordon_voice, text_to_speech
import sys

try:
    load_api_key()
    voice = get_gordon_voice()
    if voice:
        success = text_to_speech("""{text.replace('"', '\\"').replace("'", "\\'")}""", voice)
        if success:
            print("SUCCESS")
        else:
            print("FAILED")
    else:
        print("NO_VOICE")
except Exception as e:
    print(f"ERROR: {{e}}")
    sys.exit(1)
'''
            
            # Run the script in voice-testing's own environment
            result = subprocess.run(
                [str(venv_python), "-c", play_script],
                cwd=VOICE_TESTING_DIR,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            success = result.returncode == 0 and "SUCCESS" in result.stdout
            if success:
                logger.info("✅ Audio playback completed!")
            else:
                logger.error(f"❌ Audio playback failed: {result.stdout} {result.stderr}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Error playing audio: {e}")
            return False
    
    def cleanup_temp_files(self):
        """Clean up temporary audio files."""
        try:
            if self.temp_audio_dir.exists():
                for file in self.temp_audio_dir.glob("*.mp3"):
                    file.unlink()
                for file in self.temp_audio_dir.glob("*.py"):
                    file.unlink()
                logger.info("🧹 Cleaned up temporary files")
        except Exception as e:
            logger.error(f"❌ Error cleaning up temp files: {e}")


class QuoteScheduler:
    """Schedules and plays Gordon quotes at specific times during cooking sessions."""
    
    def __init__(self, tts_service: TTSService):
        self.tts_service = tts_service
        self.active_sessions = {}  # session_id -> session_data
        self.scheduler_threads = {}  # session_id -> thread
    
    def start_session(self, session_id: str, quotes: List[Dict[str, Any]], session_start_time: float):
        """Start a new quote scheduling session."""
        if not self.tts_service.is_initialized:
            logger.warning("TTS service not initialized. Quote scheduling disabled.")
            return
        
        logger.info(f"🎬 Starting quote scheduler for session {session_id}")
        
        # Store session data
        self.active_sessions[session_id] = {
            'quotes': quotes,
            'start_time': session_start_time,
            'active': True
        }
        
        # Start scheduler thread
        thread = threading.Thread(
            target=self._schedule_quotes,
            args=(session_id,),
            daemon=True
        )
        self.scheduler_threads[session_id] = thread
        thread.start()
        
        logger.info(f"✅ Quote scheduler started for session {session_id} with {len(quotes)} quotes")
    
    def _schedule_quotes(self, session_id: str):
        """Background thread to schedule quote playback."""
        session_data = self.active_sessions.get(session_id)
        if not session_data:
            return
        
        quotes = session_data['quotes']
        start_time = session_data['start_time']
        
        # Sort quotes by timestamp
        sorted_quotes = sorted(quotes, key=lambda x: x.get('timestamp', 0))
        
        for quote in sorted_quotes:
            if not session_data['active']:
                break
            
            # Calculate when to play this quote
            quote_timestamp = quote.get('timestamp', 0)
            target_time = start_time + quote_timestamp
            current_time = time.time()
            
            # Wait until it's time to play the quote
            wait_time = target_time - current_time
            if wait_time > 0:
                quote_text = quote.get('quote', '')
                logger.info(f"⏰ Waiting {wait_time:.1f}s to play quote: '{quote_text[:30]}...'")
                time.sleep(wait_time)
            
            # Check if session is still active
            if not session_data['active']:
                break
            
            # Play the quote using voice-testing
            quote_text = quote.get('quote', '')
            if quote_text:
                self.tts_service.play_audio_immediately(quote_text)
    
    def stop_session(self, session_id: str):
        """Stop quote scheduling for a session."""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]['active'] = False
            logger.info(f"⏹️ Stopped quote scheduler for session {session_id}")
        
        # Clean up thread reference
        if session_id in self.scheduler_threads:
            del self.scheduler_threads[session_id]
        
        # Clean up session data
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
    
    def cleanup_all_sessions(self):
        """Stop all active sessions and cleanup."""
        for session_id in list(self.active_sessions.keys()):
            self.stop_session(session_id)
        
        # Cleanup temp files
        self.tts_service.cleanup_temp_files()


# Global instances
_tts_service = None
_quote_scheduler = None

def get_tts_service():
    """Get or create the global TTS service instance."""
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service

def get_quote_scheduler():
    """Get or create the global quote scheduler instance."""
    global _quote_scheduler
    if _quote_scheduler is None:
        _quote_scheduler = QuoteScheduler(get_tts_service())
    return _quote_scheduler


if __name__ == "__main__":
    # Test the TTS service
    print("🧪 Testing Gordon TTS Service")
    print("=" * 50)
    
    tts = get_tts_service()
    
    if tts.is_initialized:
        test_quote = "Right! Let's get this mise en place sorted. Prep work is everything, come on!"
        print("✅ TTS Service initialized using voice-testing")
        print("🎙️ Testing immediate playback...")
        
        success = tts.play_audio_immediately(test_quote)
        if success:
            print("✅ Test playback completed successfully!")
            print("\n🎉 Gordon TTS is working!")
        else:
            print("❌ Test playback failed")
    else:
        print("❌ TTS service not initialized")
        print("\n🔧 Troubleshooting:")
        print(f"   1. Check if ELEVENLABS_API_KEY is set in .env: {'✅' if ELEVENLABS_API_KEY else '❌'}")
        print(f"   2. Check if voice-testing directory exists: {'✅' if VOICE_TESTING_DIR.exists() else '❌'}")
        if VOICE_TESTING_DIR.exists():
            venv_python = VOICE_TESTING_DIR / "venv" / "bin" / "python"
            print(f"   3. Check if voice-testing venv exists: {'✅' if venv_python.exists() else '❌'}")
            print(f"   4. Check if tts_gordon.py exists: {'✅' if (VOICE_TESTING_DIR / 'tts_gordon.py').exists() else '❌'}")
