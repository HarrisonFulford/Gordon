import { useEffect, useRef } from 'react';
import { Step } from '../types';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';

interface TimelineProps {
  steps: Step[];
  nowSeconds: number;
  totalSeconds: number;
  status?: 'idle' | 'running' | 'paused' | 'completed';
  onScrub?: (time: number) => void;
  className?: string;
}

const getStepColor = (type: string, category?: string) => {
  switch (type) {
    case 'instruction':
      return 'bg-primary text-primary-foreground';
    case 'progress':
      return 'bg-amber-500 text-black';
    case 'end':
      return 'bg-emerald-500 text-black';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'prep': return 'border-l-blue-500';
    case 'cook': return 'border-l-orange-500';
    case 'season': return 'border-l-green-500';
    case 'plate': return 'border-l-purple-500';
    default: return 'border-l-gray-500';
  }
};

export function Timeline({ steps, nowSeconds, totalSeconds, status, onScrub, className = '' }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const nowIndicatorRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to keep "now" indicator visible
  useEffect(() => {
    if (nowIndicatorRef.current && timelineRef.current) {
      const indicator = nowIndicatorRef.current;
      const container = timelineRef.current;
      const indicatorRect = indicator.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      if (indicatorRect.left < containerRect.left || indicatorRect.right > containerRect.right) {
        indicator.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [nowSeconds]);
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getStepWidth = (step: Step): number => {
    const duration = (step.tEnd || totalSeconds) - step.tStart;
    return Math.max((duration / totalSeconds) * 100, 2); // Minimum 2% width
  };
  
  const getStepLeft = (step: Step): number => {
    return (step.tStart / totalSeconds) * 100;
  };
  
  const getCurrentProgress = (): number => {
    if (status === 'completed') {
      return 100;
    }
    return Math.min((nowSeconds / totalSeconds) * 100, 100);
  };
  
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!onScrub || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = Math.floor(percentage * totalSeconds);
    
    onScrub(targetTime);
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Time scale */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>0:00</span>
        <span>{formatTime(Math.floor(totalSeconds / 2))}</span>
        <span>{formatTime(totalSeconds)}</span>
      </div>
      
      {/* Timeline container */}
      <div 
        ref={timelineRef}
        className="relative h-20 bg-muted rounded-lg cursor-pointer overflow-x-auto"
        onClick={handleTimelineClick}
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Steps */}
        {steps.map((step) => (
          <motion.div
            key={step.id}
            className={`absolute top-2 h-12 rounded border-l-4 ${getCategoryColor(step.category)} 
                       ${getStepColor(step.type)} shadow-sm hover:shadow-md transition-shadow
                       flex items-center px-2 cursor-pointer group`}
            style={{
              left: `${getStepLeft(step)}%`,
              width: `${getStepWidth(step)}%`,
              minWidth: '60px'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step.tStart / totalSeconds * 0.5 }}
            title={`${formatTime(step.tStart)} - ${step.text}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="outline" className="text-xs px-1 py-0 bg-white/20 text-black">
                {step.type}
              </Badge>
              <span className="text-xs font-medium truncate text-black">
                {step.text}
              </span>
            </div>
            
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                           bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg
                           opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
              {formatTime(step.tStart)}: {step.text}
            </div>
          </motion.div>
        ))}
        
        {/* Now indicator */}
        <motion.div
          ref={nowIndicatorRef}
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
          style={{ left: `${getCurrentProgress()}%` }}
          animate={{ left: `${getCurrentProgress()}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </motion.div>
        
        {/* Progress overlay */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-primary/10 transition-all duration-500"
          style={{ width: `${getCurrentProgress()}%` }}
        />
      </div>
    </div>
  );
}