# Gordon - AI Cooking Assistant

An intelligent cooking companion that combines computer vision, AI recipe generation, and real-time voice guidance to enhance your cooking experience.

## Features

### 🧠 AI-Powered Recipe Generation
- Upload ingredient photos to get personalized recipe suggestions
- Powered by Cohere Aya Vision for intelligent ingredient analysis
- Generates detailed cooking timelines with step-by-step instructions

### 📸 Real-Time Kitchen Monitoring
- Captures webcam frames during cooking sessions
- AI-powered food ingredient classification (cheese, pickles, bread, tomatoes, lettuce, meat)
- Automatic cleanup and categorization of captured ingredient images

### 🎙️ Gordon Ramsay Voice Integration
- **Custom Gordon Ramsay voice** using ElevenLabs TTS
- **Timed motivational quotes** delivered at perfect moments during cooking
- **Real-time audio guidance** synchronized with cooking steps
- **Depends on**: `../voice-testing/` directory for TTS functionality
- **Optional feature** - works without TTS if not configured

### 🎬 Interactive Cooking Sessions
- Live session management with play/pause controls
- Visual timeline showing cooking progress
- Keyboard shortcuts for easy control
- Real-time status updates and notifications

## Technical Architecture

### TTS Integration Design
Gordon uses a **subprocess approach** to leverage the working `voice-testing` implementation:

1. **Problem**: ElevenLabs 2.15.0 has Python 3.13 compatibility issues in complex environments
2. **Solution**: Gordon calls the working `voice-testing/tts_gordon.py` via subprocess
3. **Benefits**: 
   - Uses your proven TTS setup without modification
   - Zero risk to Gordon's core functionality
   - Clean separation of concerns
   - Future-proof when ElevenLabs fixes compatibility

### API Endpoints
- `POST /api/recipes/generate` - Generate recipes from ingredient image
- `POST /api/session/start` - Start cooking session (webcam + TTS)
- `POST /api/session/stop` - Stop cooking session
- `GET /api/session/status` - Get session status (includes TTS status)
- `POST /api/speech/interact` - Interactive speech with Gordon
- `GET /api/health` - Health check

## Dependencies

### Core Dependencies (Gordon)
- `cohere>=5.0.0` - AI recipe generation and ingredient classification
- `opencv-python>=4.5.0` - Webcam capture and image processing
- `flask>=2.3.0` - API server
- `pillow>=9.0.0` - Image manipulation

### TTS Dependencies (Voice-Testing)
- `elevenlabs==2.15.0` - Text-to-speech with custom Gordon voice
- `python-dotenv==1.1.1` - Environment variable management

### Frontend Dependencies
- React 18 with TypeScript
- Radix UI components
- Tailwind CSS styling
- Zustand state management

