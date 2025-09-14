import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { gordonAPI } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface PushToTalkProps {
  enabled: boolean;
  sessionActive: boolean;
  currentStep?: string;
  onGordonResponse?: (response: string) => void;
}

export function PushToTalk({ 
  enabled, 
  sessionActive, 
  currentStep,
  onGordonResponse 
}: PushToTalkProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Track spacebar state to prevent conflicts
  const isSpacePressed = useRef(false);

  const handleTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim() || !sessionActive) {
      console.log('⚠️ Empty transcript or session not active');
      return;
    }
    
    console.log('📝 Processing transcript:', transcript);
    setIsProcessing(true);
    setSpeechError(null);
    
    try {
      // Send speech to Gordon with current cooking context
      const result = await gordonAPI.sendSpeechToGordon(transcript, currentStep);
      
      const response = result.gordon_response;
      setLastResponse(response);
      setShowResponse(true);
      onGordonResponse?.(response);
      
      console.log('✅ Gordon responded:', response);
      
      // Hide response after 8 seconds (longer to read)
      setTimeout(() => setShowResponse(false), 8000);
      
    } catch (error) {
      console.error('❌ Failed to get Gordon response:', error);
      setSpeechError(error instanceof Error ? error.message : 'Failed to get Gordon response');
      
      // Clear error after 5 seconds
      setTimeout(() => setSpeechError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionActive, currentStep, onGordonResponse]);

  const handleSpeechError = useCallback((error: string) => {
    console.error('🚫 Speech recognition error:', error);
    setSpeechError(`Speech recognition: ${error}`);
    
    // Clear error after 5 seconds
    setTimeout(() => setSpeechError(null), 5000);
  }, []);

  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    error: recognitionError,
    hasPermission,
    requestPermission
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onError: handleSpeechError,
    enabled: enabled && sessionActive
  });

  // Handle spacebar push-to-talk with improved state management
  useEffect(() => {
    if (!enabled || !sessionActive || !isSupported) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar for push-to-talk
      if (e.code === 'Space' && 
          !(e.target instanceof HTMLInputElement) && 
          !(e.target instanceof HTMLTextAreaElement)) {
        
        // Prevent default spacebar behavior
        e.preventDefault();
        
        // Only start if spacebar not already pressed and not currently listening/processing
        if (!isSpacePressed.current && !isListening && !isProcessing) {
          console.log('🎤 Spacebar pressed - starting listening');
          isSpacePressed.current = true;
          startListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        
        // Only stop if spacebar was pressed by us and we're listening
        if (isSpacePressed.current && isListening) {
          console.log('🛑 Spacebar released - stopping listening');
          isSpacePressed.current = false;
          stopListening();
        }
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      // Reset state on cleanup
      isSpacePressed.current = false;
    };
  }, [enabled, sessionActive, isSupported, isListening, isProcessing, startListening, stopListening]);

  // Show any error (from speech recognition or API)
  const displayError = recognitionError || speechError;

  // Don't render if not supported
  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <MicOff className="w-4 h-4" />
            <span className="text-sm">Speech recognition not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show permission request if needed
  if (enabled && sessionActive && !hasPermission) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Microphone Permission Required</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Allow microphone access to talk to Gordon during cooking sessions.
            </p>
            <Button 
              size="sm" 
              onClick={requestPermission}
              className="w-full"
            >
              Grant Microphone Permission
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!enabled || !sessionActive) {
    return (
      <Card className="border-muted bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MicOff className="w-4 h-4" />
            <span className="text-sm">Push-to-talk disabled (session not active)</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Push-to-talk indicator */}
      <Card className={`transition-all duration-200 ${
        isListening 
          ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950 shadow-lg' 
          : isProcessing
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
          : 'border-muted bg-card'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {isListening ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Mic className="w-5 h-5 text-red-500" />
                </motion.div>
              ) : isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                </motion.div>
              ) : (
                <Mic className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              {isListening ? (
                <div>
                  <p className="font-medium text-red-700 dark:text-red-300">
                    🎙️ Listening... (release spacebar to send)
                  </p>
                  {transcript && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      "{transcript}"
                    </p>
                  )}
                </div>
              ) : isProcessing ? (
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  🤔 Gordon is thinking...
                </p>
              ) : (
                <div>
                  <p className="font-medium">Talk to Gordon</p>
                  <p className="text-sm text-muted-foreground">
                    Hold <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> to speak
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {displayError && (
            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900 rounded text-sm text-red-700 dark:text-red-300">
              ❌ <strong>Error:</strong> {displayError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gordon's response */}
      <AnimatePresence>
        {showResponse && lastResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    🍳
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                      Gordon Ramsay
                    </p>
                    <p className="text-green-700 dark:text-green-300">
                      "{lastResponse}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 