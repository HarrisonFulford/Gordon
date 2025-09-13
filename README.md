# Webcam Frame Capture Script

This script captures frames from your MacBook's webcam at 1 frame per second and saves them with timestamp-based naming.

## Features

- Captures 1 frame per second from webcam
- Saves images with naming format: `YYYYMMDD_HHMMSSmmm.jpg`
- Automatically manages the `stream-test` folder to keep only the 10 most recent images
- Shows live webcam preview (press 'q' to quit)

## Setup with Virtual Environment (Recommended)

1. Create a virtual environment:
```bash
python3 -m venv venv
```

2. Activate the virtual environment:
```bash
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

3. Install the required dependencies:
```bash
pip install -r requirements.txt
```

4. When you're done, deactivate the virtual environment:
```bash
deactivate
```

## Installation (Alternative - Global)

If you prefer not to use a virtual environment, you can install dependencies globally:
```bash
pip3 install -r requirements.txt
```

## Usage

Run the script:
```bash
python3 webcam_capture.py
```

- The script will start capturing frames and saving them to the `stream-test` folder
- Press 'q' in the webcam preview window to quit
- Or use Ctrl+C in the terminal to stop

## Troubleshooting

If you get "command not found" errors:
- Use `python3` instead of `python`
- Use `pip3` instead of `pip`
- Make sure Python 3 is installed: `python3 --version`

## File Management

- Images are saved with timestamps in the format: `20241201_143052123.jpg`
- The script automatically deletes the oldest images when more than 10 images are present
- Only the 10 most recent images are kept in the folder

## Configuration

You can modify these settings in the script:
- `MAX_IMAGES`: Maximum number of images to keep (default: 10)
- `CAPTURE_INTERVAL`: Time between captures in seconds (default: 1.0)
- `IMAGE_FORMAT`: Output image format (default: "jpg")
- `OUTPUT_FOLDER`: Folder to save images (default: "stream-test")
