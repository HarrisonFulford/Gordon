import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  addEventListener(type: 'start', listener: () => void): void;
  addEventListener(type: 'end', listener: () => void): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseSpeechRecognitionProps {
  onTranscript: (transcript: string) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useSpeechRecognition({
  onTranscript,
  onError,
  enabled = true
}: UseSpeechRecognitionProps): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);

  // Check microphone permission
  const checkMicrophonePermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const permitted = result.state === 'granted';
      setHasPermission(permitted);
      console.log('🎤 Microphone permission:', result.state);
      return permitted;
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
      return false;
    }
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setHasPermission(true);
      console.log('✅ Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      setError('Microphone permission required for speech recognition');
      setHasPermission(false);
      return false;
    }
  }, []);

  // Check if speech recognition is supported and set up
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        // Update transcript state
        const currentTranscript = finalTranscriptRef.current + finalTranscript + interimTranscript;
        setTranscript(currentTranscript);
        
        // Update final transcript reference
        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
        }
      });
      
      recognition.addEventListener('start', () => {
        console.log('🎙️ Speech recognition started successfully');
        setIsListening(true);
        setError(null);
        setTranscript('');
        finalTranscriptRef.current = '';
        isStartingRef.current = false;
      });
      
      recognition.addEventListener('end', () => {
        console.log('🎙️ Speech recognition ended');
        setIsListening(false);
        isStoppingRef.current = false;
        
        // Send final transcript when recognition ends
        const finalText = finalTranscriptRef.current.trim();
        if (finalText) {
          console.log('📝 Final transcript:', finalText);
          onTranscript(finalText);
        } else {
          console.log('⚠️ No transcript captured');
        }
        
        // Reset transcript
        setTranscript('');
        finalTranscriptRef.current = '';
      });
      
      recognition.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
        console.error('🚫 Speech recognition error:', event.error, event);
        
        // Handle specific error types
        let errorMessage = event.error;
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Try speaking louder.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Check your audio settings.';
            break;
          case 'network':
            errorMessage = 'Network error. Check your internet connection.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted. This might be due to browser limitations.';
            break;
        }
        
        setError(errorMessage);
        setIsListening(false);
        isStartingRef.current = false;
        isStoppingRef.current = false;
        onError?.(errorMessage);
      });
      
      recognitionRef.current = recognition;
      
      // Check microphone permission on setup
      checkMicrophonePermission();
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript, onError, checkMicrophonePermission]);

  const startListening = useCallback(async () => {
    if (!enabled || !isSupported || !recognitionRef.current) {
      console.log('❌ Cannot start listening:', { enabled, isSupported, hasRecognition: !!recognitionRef.current });
      return;
    }
    
    // Prevent multiple start attempts
    if (isListening || isStartingRef.current) {
      console.log('⚠️ Already listening or starting');
      return;
    }

    // Check/request microphone permission first
    if (!hasPermission) {
      console.log('🎤 Requesting microphone permission...');
      const permitted = await requestPermission();
      if (!permitted) {
        console.log('❌ Microphone permission denied');
        return;
      }
    }
    
    try {
      console.log('🎤 Starting speech recognition...');
      isStartingRef.current = true;
      setError(null);
      recognitionRef.current.start();
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      setError('Failed to start speech recognition');
      isStartingRef.current = false;
    }
  }, [enabled, isSupported, isListening, hasPermission, requestPermission]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.log('❌ No recognition instance to stop');
      return;
    }
    
    // Prevent multiple stop attempts
    if (!isListening || isStoppingRef.current) {
      console.log('⚠️ Not listening or already stopping');
      return;
    }
    
    try {
      console.log('🛑 Stopping speech recognition...');
      isStoppingRef.current = true;
      recognitionRef.current.stop();
    } catch (error) {
      console.error('❌ Failed to stop speech recognition:', error);
      isStoppingRef.current = false;
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    error,
    hasPermission,
    requestPermission
  };
} 