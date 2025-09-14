# Gordon - AI Cooking Assistant

An intelligent cooking companion that combines computer vision, AI recipe generation, and real-time voice guidance to enhance your cooking experience. Features Gordon Ramsay's custom voice providing motivational cooking quotes at precisely timed moments.

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

## Prerequisites

### Required Dependencies
1. **Gordon Project**: This directory (AI cooking assistant)
2. **Voice-Testing Project**: `../voice-testing/` directory (ElevenLabs TTS)
3. **API Keys**: Cohere (required) + ElevenLabs (optional for voice)

### Project Structure
```
htn/
├── Gordon/                 # Main cooking assistant (this project)
│   ├── backend/           # Python API & AI services
│   ├── frontend/          # React TypeScript UI
│   └── categories/        # Classified images
└── voice-testing/         # ElevenLabs TTS service (dependency)
    ├── tts_gordon.py     # Working TTS implementation
    ├── venv/             # Clean ElevenLabs environment
    └── .env              # ElevenLabs API key
```

## Setup

### 1. Set Up Voice-Testing (TTS Dependency)
```bash
cd ../voice-testing
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Add your ElevenLabs API key to voice-testing/.env
echo "ELEVENLABS_API_KEY=your_key_here" > .env

# Test TTS works
python tts_gordon.py
```

### 2. Set Up Gordon (Main Project)
```bash
cd ../Gordon
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure API keys
cp env.example .env
# Edit .env and add:
# - COHERE_API_KEY (required for AI features)
# - ELEVENLABS_API_KEY (same as voice-testing)
```

### 3. Test TTS Integration
```bash
# Test that Gordon can use voice-testing for TTS
python -m backend.tts_service
```
*Expected: Gordon speaks a test quote using your custom voice*

## Usage

### Start the Application

**Terminal 1 (Backend):**
```bash
cd Gordon
source venv/bin/activate
python run_server.py
```

**Terminal 2 (Frontend):**
```bash
cd Gordon/frontend
npm run dev
```

**Open Application:**
- Navigate to `http://localhost:5173`
- Backend API runs on `http://localhost:5001`

### Complete Cooking Experience

1. **Upload Ingredients**: Take a photo of your ingredients
2. **Select Recipe**: Choose from AI-generated recipe suggestions
3. **Start Session**: Begin guided cooking with real-time timeline
4. **Listen to Gordon**: Hear motivational quotes at perfect timing:
   - **30 seconds**: "Right! Let's get this mise en place sorted..."
   - **5 minutes**: "Beautiful! Now we're cooking. Heat that pan up..."
   - **Completion**: "Perfect! That's how you finish a dish..."

### Controls
- **Space**: Play/pause cooking session
- **R**: Repeat last instruction
- **L**: Toggle TTS on/off
- **Visual indicator**: Shows "Gordon TTS Active" when voice is enabled

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
- `POST /api/speech/interact` - Interactive speech with Gordon (NEW!)
- `GET /api/health` - Health check

## Troubleshooting

### TTS Not Working
1. **Check voice-testing**: `cd ../voice-testing && python tts_gordon.py`
2. **Check API key**: Ensure `ELEVENLABS_API_KEY` is in both `.env` files
3. **Check Gordon voice**: Voice ID `2qkO9rb42qS5jRK9294E` must exist in your account
4. **Check paths**: Ensure `voice-testing` directory exists at `../voice-testing`

### Push-to-Talk Issues
1. **Microphone permission**: Browser must have microphone access
2. **HTTPS required**: Speech recognition requires secure connection in production
3. **Browser support**: Works in Chrome, Firefox, Safari (latest versions)
4. **Session active**: Feature only works during active cooking sessions

### Frontend Issues
- **Wrong port**: Frontend should be on `http://localhost:5173`, not 3000
- **API connection**: Backend must be running on `http://localhost:5001`
- **CORS errors**: Make sure both servers are running

### Backend Issues
- **Missing dependencies**: Run `pip install -r requirements.txt` in activated venv
- **API keys**: Check that both Cohere and ElevenLabs keys are configured
- **Webcam access**: Grant camera permissions when prompted

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

## Related Projects

- **Voice-Testing**: `../voice-testing/` - ElevenLabs TTS implementation
- **Model-Testing**: `../model-testing/` - Cohere image classification testing