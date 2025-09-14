import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { SessionClock } from '../components/SessionClock';
import { NextActionCard } from '../components/NextActionCard';
import { Timeline } from '../components/Timeline';
import { Transport } from '../components/Transport';
import { useSessionStore } from '../stores/sessionStore';
import { gordonAPI } from '../services/api';

import { motion } from 'motion/react';

export function LiveSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  
  const {
    summary,
    nextAction,
    timeline,
    isConnected,
    speakerEnabled,
    setSummary,
    setNextAction,
    setTimeline,
    addLogEntry,
    setConnected,
    toggleSpeaker,
    startSession,
    endSession,
    repeatLastInstruction,
    getCurrentSessionTime
  } = useSessionStore();
  
  // Load initial data
  useEffect(() => {
    const loadSessionData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Try to load recipe data from session storage
        const storedRecipe = sessionStorage.getItem('selectedRecipe');
        let recipeData = null;
        if (storedRecipe) {
          recipeData = JSON.parse(storedRecipe);
        }
        
        // Create session summary from recipe data
        const summaryData = {
          id: id,
          dishName: recipeData?.name || 'Cooking Session',
          totalSeconds: recipeData ? recipeData.cookTime * 60 : 1800, // Convert minutes to seconds
          startedAt: new Date().toISOString(),
          status: 'idle' as const
        };
        
        // Use recipe timeline from stored recipe data
        const timelineData = recipeData?.timeline || [];
        
        setSummary(summaryData);
        setTimeline(timelineData);
        
        // Initialize next action with first timeline step
        if (timelineData.length > 0) {
          setNextAction({
            nowSeconds: 0,
            next: {
              t: timelineData[0].tStart,
              type: timelineData[0].type,
              text: timelineData[0].text,
              category: timelineData[0].category
            },
            queue: timelineData
          });
        }
        
        // Add initial log entry
        addLogEntry({
          ts: Date.now(),
          icon: 'info',
          msg: `Session ${id} loaded successfully`,
          type: 'system'
        });
        
      } catch (error) {
        console.error('Failed to load session data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessionData();
  }, [id, setSummary, setTimeline, addLogEntry]);
  
  // Connect to backend session management
  useEffect(() => {
    if (!id || !summary) return;
    
    // Set up session status polling
    const pollSessionStatus = async () => {
      try {
        const status = await gordonAPI.getSessionStatus();
        setConnected(true);
        setTtsEnabled(status.tts_enabled);
        
        // Update next action based on current time
        if (timeline.length > 0) {
          const now = Math.floor((Date.now() - new Date(summary.startedAt).getTime()) / 1000);
          const currentStep = timeline.find(step => step.tStart <= now && (!step.tEnd || step.tEnd > now));
          const nextStep = timeline.find(step => step.tStart > now);
          const upcomingSteps = timeline.filter(step => step.tStart > now).slice(0, 3);
          
          let activeStep;
          if (currentStep) {
            activeStep = currentStep;
          } else if (nextStep) {
            activeStep = nextStep;
          } else {
            activeStep = {
              tStart: now,
              type: 'end' as const,
              text: 'Session complete - all steps finished!',
              category: 'complete'
            };
          }
          
          setNextAction({
            nowSeconds: now,
            next: {
              t: activeStep.tStart,
              type: activeStep.type,
              text: activeStep.text,
              category: activeStep.category
            },
            queue: upcomingSteps
          });
        }
      } catch (error) {
        console.error('Failed to get session status:', error);
        setConnected(false);
      }
    };
    
    // Poll every 2 seconds
    const interval = setInterval(pollSessionStatus, 2000);
    pollSessionStatus(); // Initial call
    
    return () => clearInterval(interval);
  }, [id, summary, timeline, setNextAction, setConnected]);
  
  // Timer and nextAction updates based on session status
  useEffect(() => {
    if (!summary || !timeline.length) return;
    
    const updateSessionState = () => {
      const currentTime = Math.floor(getCurrentSessionTime() / 1000); // Convert to seconds
      
      // Find current step based on timer
      const currentStep = timeline.find(step => 
        currentTime >= step.tStart && (!step.tEnd || currentTime < step.tEnd)
      );
      const nextStep = timeline.find(step => step.tStart > currentTime);
      const upcomingSteps = timeline.filter(step => step.tStart > currentTime).slice(0, 3);
      
      let activeStep;
      if (currentStep) {
        activeStep = currentStep;
      } else if (nextStep) {
        activeStep = nextStep;
      } else {
        activeStep = {
          tStart: currentTime,
          type: 'end' as const,
          text: 'Session complete - all steps finished!',
          category: 'complete'
        };
      }
      
      setNextAction({
        nowSeconds: currentTime,
        next: {
          t: activeStep.tStart,
          type: activeStep.type,
          text: activeStep.text,
          category: activeStep.category
        },
        queue: upcomingSteps
      });
    };
    
    // Update immediately
    updateSessionState();
    
    // Only update every second when session is running
    let interval: NodeJS.Timeout | null = null;
    if (summary.status === 'running') {
      interval = setInterval(updateSessionState, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [summary?.status, timeline, getCurrentSessionTime, setNextAction]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (summary?.status === 'idle') {
            startSession();
          }
          break;
        case 'r':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            repeatLastInstruction();
          }
          break;
        case 'l':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            toggleSpeaker();
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [summary?.status, startSession, repeatLastInstruction, toggleSpeaker]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!summary || !nextAction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session not found</h2>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <motion.div 
        className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/recipes')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div>
                <h1 className="font-bold">{summary.dishName}</h1>
                <p className="text-sm text-muted-foreground">Session {summary.id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* TTS Status Indicator */}
              <div className="flex items-center gap-2 text-sm">
                {ttsEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">Gordon TTS Active</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">TTS Disabled</span>
                  </>
                )}
              </div>
              
              {/* Transport controls */}
              <Transport
                status={summary.status === 'paused' ? 'idle' : summary.status}
                speakerEnabled={speakerEnabled}
                isConnected={isConnected}
                onStart={startSession}
                onEnd={endSession}
                onToggleSpeaker={toggleSpeaker}
              />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Main content - new 3-section layout */}
      <div className="container mx-auto p-4">
        {/* Top center: Session Clock */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SessionClock
              nowSeconds={Math.floor(getCurrentSessionTime() / 1000)}
              startedAt={summary.startedAt}
              status={summary.status}
            />
          </motion.div>
        </div>

        {/* Bottom row: Next Action (left) and Timeline (right) */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Bottom Left: Next Action */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <NextActionCard
              next={nextAction.next}
              etaSeconds={nextAction.next.t - nextAction.nowSeconds}
              nowSeconds={nextAction.nowSeconds}
            />
          </motion.div>
          
          {/* Bottom Right: Timeline */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-medium mb-4">Session Timeline</h3>
              <Timeline
                steps={timeline}
                nowSeconds={Math.floor(getCurrentSessionTime() / 1000)}
                totalSeconds={summary.totalSeconds}
                status={summary.status}
                onScrub={(time) => {
                  addLogEntry({
                    ts: Date.now(),
                    icon: 'info',
                    msg: `Scrubbed to ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`,
                    type: 'system'
                  });
                }}
              />
            </div>
          </motion.div>
        </div>
        
        {/* Keyboard shortcuts help */}
        <motion.div 
          className="mt-8 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <p>
            Keyboard shortcuts: <kbd>Space</kbd> = Play/Pause, 
            <kbd>R</kbd> = Repeat instruction, <kbd>L</kbd> = Toggle TTS
          </p>
          {ttsEnabled && (
            <p className="mt-2 text-green-500 font-medium">
              🎙️ Gordon will speak cooking instructions at the right time!
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
