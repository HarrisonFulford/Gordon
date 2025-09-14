import { useRef } from 'react';
import { ChefHat, Clock, Info, RotateCcw, AlertCircle } from 'lucide-react';
import { LogEntry } from '../types';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface ActionLogProps {
  entries: LogEntry[];
  className?: string;
}

const getLogIcon = (icon: string, type: string) => {
  switch (icon) {
    case 'chef-hat': return <ChefHat className="w-4 h-4" />;
    case 'clock': return <Clock className="w-4 h-4" />;
    case 'repeat': return <RotateCcw className="w-4 h-4" />;
    case 'info': return <Info className="w-4 h-4" />;
    default:
      // Fallback based on type
      switch (type) {
        case 'instruction': return <ChefHat className="w-4 h-4" />;
        case 'progress': return <Clock className="w-4 h-4" />;
        case 'system': return <Info className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
      }
  }
};

const getLogColor = (type: string) => {
  switch (type) {
    case 'instruction': return 'text-primary bg-primary/10';
    case 'progress': return 'text-black dark:text-white bg-amber-100 dark:bg-amber-900/20';
    case 'system': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    default: return 'text-muted-foreground bg-muted';
  }
};

const formatTimestamp = (ts: number): string => {
  const date = new Date(ts);
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

export function ActionLog({ entries, className = '' }: ActionLogProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Removed auto-scroll functionality
  
  if (entries.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Action log is empty</p>
          <p className="text-sm">Activity will appear here as the session progresses</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-card border rounded-lg ${className}`}>
      <div className="p-4 border-b">
        <h3 className="font-medium">Action Log</h3>
        <p className="text-xs text-muted-foreground">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </p>
      </div>
      
      <ScrollArea className="h-64" ref={scrollAreaRef}>
        <div className="p-4 space-y-3">
          <AnimatePresence initial={false}>
            {entries.map((entry, index) => (
              <motion.div
                key={`${entry.ts}-${index}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className={`flex-shrink-0 p-1.5 rounded-full ${getLogColor(entry.type)}`}>
                  {getLogIcon(entry.icon, entry.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {entry.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimestamp(entry.ts)}
                    </span>
                  </div>
                  
                  <p className="text-sm leading-relaxed">
                    {entry.msg}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}