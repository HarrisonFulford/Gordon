import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface SessionClockProps {
  nowSeconds: number;
  startedAt: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  className?: string;
}

export function SessionClock({ nowSeconds, startedAt, status, className = '' }: SessionClockProps) {
  const [displayTime, setDisplayTime] = useState(nowSeconds);
  
  useEffect(() => {
    // Only run timer when session is running
    if (status !== 'running') {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000);
      
      // Optimistic UI - increment locally
      setDisplayTime(prev => prev + 1);
      
      // Resync if drift > 250ms
      if (Math.abs(elapsed - displayTime) > 0.25) {
        setDisplayTime(elapsed);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [status, startedAt, displayTime]);
  
  // Update when prop changes (from WebSocket or state changes)
  useEffect(() => {
    setDisplayTime(nowSeconds);
  }, [nowSeconds]);
  
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle': return 'Ready to Start';
      case 'running': return 'Session Time';
      case 'paused': return 'Paused';
      case 'completed': return 'Session Complete';
      default: return 'Session Time';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle': return 'text-muted-foreground';
      case 'running': return 'text-primary';
      case 'paused': return 'text-amber-500';
      case 'completed': return 'text-emerald-500';
      default: return 'text-primary';
    }
  };
  
  return (
    <motion.div 
      className={`font-mono tracking-wider ${className}`}
      animate={status === 'running' ? { 
        scale: [1, 1.02, 1],
        transition: { duration: 0.1, ease: 'easeOut' }
      } : {}}
      key={status === 'running' ? Math.floor(displayTime / 1) : status} // Only animate when running
    >
      <div className="bg-card border rounded-lg p-6 text-center">
        <div className={`text-4xl md:text-6xl font-bold mb-2 ${getStatusColor()}`}>
          {formatTime(displayTime)}
        </div>
        <div className="text-sm text-muted-foreground">
          {getStatusText()}
        </div>
      </div>
    </motion.div>
  );
}