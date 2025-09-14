import { Step } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Clock, ChefHat, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface UpcomingActionsProps {
  steps: Step[];
  nowSeconds: number;
  className?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'instruction': return <ChefHat className="w-3 h-3" />;
    case 'progress': return <Clock className="w-3 h-3" />;
    case 'end': return <CheckCircle className="w-3 h-3" />;
    default: return <ChefHat className="w-3 h-3" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'instruction': return 'default';
    case 'progress': return 'secondary';
    case 'end': return 'outline';
    default: return 'default';
  }
};

const formatTimeUntil = (seconds: number): string => {
  if (seconds <= 0) return 'Now';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export function UpcomingActions({ steps, nowSeconds, className = '' }: UpcomingActionsProps) {
  // Filter and sort upcoming steps
  const upcomingSteps = steps
    .filter(step => step.tStart > nowSeconds)
    .sort((a, b) => a.tStart - b.tStart)
    .slice(0, 3);
  
  if (upcomingSteps.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Upcoming Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No more actions scheduled</p>
            <p className="text-sm">Session is nearly complete</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming Actions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Next {upcomingSteps.length} {upcomingSteps.length === 1 ? 'action' : 'actions'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingSteps.map((step, index) => {
          const timeUntil = step.tStart - nowSeconds;
          const isImminent = timeUntil <= 30; // Highlight if within 30 seconds
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border transition-all ${
                isImminent ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {getTypeIcon(step.type)}
                    <Badge variant={getTypeColor(step.type) as any} className="text-xs">
                      {step.type}
                    </Badge>
                  </div>
                  {step.category && (
                    <Badge variant="outline" className="text-xs">
                      {step.category}
                    </Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground font-mono">
                  {formatTime(step.tStart)}
                </div>
              </div>
              
              <p className="text-sm leading-relaxed mb-2">
                {step.text}
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${
                  isImminent ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {isImminent ? '⚡ ' : ''}At {formatTime(step.tStart)}
                </span>
                
                {isImminent && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-primary rounded-full"
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}