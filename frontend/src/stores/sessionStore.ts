import { create } from 'zustand';
import { SessionSummary, NextAction, Step, LatestImage, LogEntry } from '../types';
import { gordonAPI, SessionStatus } from '../services/api';

interface SessionState {
  // Current session data
  summary: SessionSummary | null;
  nextAction: NextAction | null;
  timeline: Step[];
  images: LatestImage[];
  logEntries: LogEntry[];
  
  // UI state
  isConnected: boolean;
  compactMode: boolean;
  micEnabled: boolean;
  speakerEnabled: boolean;
  
  // Gordon integration state
  isCapturing: boolean;
  backendStatus: SessionStatus | null;
  categoryStats: { [category: string]: { count: number; latest?: string } };
  
  // Timer state
  sessionStartTime: number | null;
  pausedDuration: number;
  lastPauseTime: number | null;
  
  // Actions
  setSummary: (summary: SessionSummary) => void;
  setNextAction: (action: NextAction) => void;
  setTimeline: (timeline: Step[]) => void;
  setImages: (images: LatestImage[]) => void;
  addLogEntry: (entry: LogEntry) => void;
  setConnected: (connected: boolean) => void;
  toggleCompactMode: () => void;
  toggleMic: () => void;
  toggleSpeaker: () => void;
  
  // Gordon integration actions
  startCapture: (timeline?: Step[], sessionId?: string) => Promise<void>;
  stopCapture: () => Promise<void>;
  updateBackendStatus: () => Promise<void>;
  setCategoryStats: (stats: any) => void;
  
  // Transport controls
  startSession: () => void;
  pauseSession: () => void;
  endSession: () => void;
  repeatLastInstruction: () => void;
  
  // Timer helpers
  getCurrentSessionTime: () => number;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  summary: null,
  nextAction: null,
  timeline: [],
  images: [],
  logEntries: [],
  isConnected: false,
  compactMode: false,
  micEnabled: true,
  speakerEnabled: true,
  
  // Gordon integration initial state
  isCapturing: false,
  backendStatus: null,
  categoryStats: {},
  
  // Timer initial state
  sessionStartTime: null,
  pausedDuration: 0,
  lastPauseTime: null,
  
  // Actions
  setSummary: (summary) => set({ summary }),
  setNextAction: (nextAction) => set({ nextAction }),
  setTimeline: (timeline) => set({ timeline }),
  setImages: (images) => set({ images }),
  addLogEntry: (entry) => set((state) => ({ 
    logEntries: [...state.logEntries, entry] 
  })),
  setConnected: (connected) => set({ isConnected: connected }),
  toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
  toggleMic: () => set((state) => ({ micEnabled: !state.micEnabled })),
  toggleSpeaker: () => set((state) => ({ speakerEnabled: !state.speakerEnabled })),
  
  // Gordon integration actions
  startCapture: async (timeline = [], sessionId) => {
    try {
      await gordonAPI.startSession(timeline, sessionId);
      set({ isCapturing: true });
      get().updateBackendStatus();
    } catch (error) {
      console.error('Failed to start capture:', error);
    }
  },
  
  stopCapture: async () => {
    try {
      await gordonAPI.stopSession();
      set({ isCapturing: false });
      get().updateBackendStatus();
    } catch (error) {
      console.error('Failed to stop capture:', error);
    }
  },
  
  updateBackendStatus: async () => {
    try {
      const status = await gordonAPI.getSessionStatus();
      set({ 
        backendStatus: status,
        isCapturing: status.webcam_running,
        categoryStats: status.categories
      });
    } catch (error) {
      console.error('Failed to get backend status:', error);
    }
  },
  
  setCategoryStats: (stats) => set({ categoryStats: stats }),
  
  // Transport controls (Gordon integration)
  startSession: () => {
    console.log('🎬 Starting session from store');
    const { summary, timeline } = get();
    console.log('📋 Timeline data:', timeline);
    if (summary) {
      const now = Date.now();
      set({
        summary: { ...summary, status: 'running' },
        sessionStartTime: now,
        pausedDuration: 0,
        lastPauseTime: null
      });
      
      // Start webcam capture and TTS when session starts
      get().startCapture(timeline, summary.id);
    }
  },
  pauseSession: () => {
    const { summary, sessionStartTime, pausedDuration, lastPauseTime } = get();
    if (summary) {
      const now = Date.now();
      let newPausedDuration = pausedDuration;
      
      // If we were running, add the time since last start/resume to paused duration
      if (summary.status === 'running' && sessionStartTime && !lastPauseTime) {
        newPausedDuration += now - sessionStartTime;
      }
      
      set({
        summary: { ...summary, status: 'paused' },
        lastPauseTime: now,
        pausedDuration: newPausedDuration
      });
    }
    // Keep webcam running during pause
  },
  endSession: () => {
    const { summary } = get();
    if (summary) {
      set({
        summary: { ...summary, status: 'completed' },
        sessionStartTime: null,
        pausedDuration: 0,
        lastPauseTime: null
      });
    }
    // Stop webcam capture when session ends
    get().stopCapture();
  },
  repeatLastInstruction: () => {
    // Mock implementation - in real app would trigger TTS
    const lastInstruction = get().logEntries
      .filter(entry => entry.type === 'instruction')
      .pop();
    
    if (lastInstruction) {
      get().addLogEntry({
        ts: Date.now(),
        icon: 'repeat',
        msg: `Repeated: ${lastInstruction.msg}`,
        type: 'system'
      });
    }
  },

  // Timer helpers
  getCurrentSessionTime: () => {
    const { sessionStartTime, pausedDuration, lastPauseTime, summary } = get();
    
    if (!sessionStartTime || summary?.status !== 'running') {
      return pausedDuration;
    }
    
    const now = Date.now();
    const runningTime = now - sessionStartTime;
    return pausedDuration + runningTime;
  }
}));
