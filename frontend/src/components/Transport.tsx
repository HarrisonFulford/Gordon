import { Play, Square, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';

interface TransportProps {
  status: 'idle' | 'running' | 'completed';
  speakerEnabled: boolean;
  isConnected: boolean;
  onStart: () => void;
  onEnd: () => void;
  onToggleSpeaker: () => void;
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-green-500';
    case 'completed': return 'bg-emerald-500';
    case 'idle': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'running': return 'Running';
    case 'completed': return 'Completed';
    case 'idle': return 'Ready';
    default: return 'Unknown';
  }
};

export function Transport({ 
  status, 
  speakerEnabled, 
  isConnected,
  onStart, 
  onEnd, 
  onToggleSpeaker,
  className = '' 
}: TransportProps) {
  
  const canStart = status === 'idle';
  const canEnd = status !== 'idle' && status !== 'completed';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <motion.div
          className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}
          animate={status === 'running' ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <Badge variant="outline" className="text-xs">
          {getStatusText(status)}
        </Badge>
      </div>
      
      {/* Connection status */}
      <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
        {isConnected ? 'Connected' : 'Polling'}
      </Badge>
      
      {/* Transport controls */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={canStart ? 'default' : 'outline'}
          onClick={onStart}
          disabled={!canStart}
          className="flex items-center gap-1"
        >
          <Play className="w-3 h-3" />
          Start
        </Button>
        
        <Button
          size="sm"
          variant="destructive"
          onClick={onEnd}
          disabled={!canEnd}
          className="flex items-center gap-1"
        >
          <Square className="w-3 h-3" />
          End
        </Button>
      </div>
      
      {/* Audio controls */}
      <div className="flex items-center gap-1 ml-2 pl-2 border-l">
        <Button
          size="sm"
          variant={speakerEnabled ? 'default' : 'outline'}
          onClick={onToggleSpeaker}
          className="flex items-center gap-1"
        >
          {speakerEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          <span className="sr-only">Toggle speaker</span>
        </Button>
      </div>
    </div>
  );
}