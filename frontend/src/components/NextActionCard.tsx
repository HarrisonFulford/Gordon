import { Clock, ChefHat, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';

interface NextActionCardProps {
  next: {
    t: number;
    type: 'instruction' | 'progress' | 'end';
    text: string;
    category?: string;
  };
  etaSeconds: number;
  nowSeconds: number;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'instruction': return <ChefHat className="w-4 h-4" />;
    case 'progress': return <Clock className="w-4 h-4" />;
    case 'end': return <CheckCircle className="w-4 h-4" />;
    default: return <ChefHat className="w-4 h-4" />;
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

const formatETA = (seconds: number): string => {
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

export function NextActionCard({ next, etaSeconds, nowSeconds }: NextActionCardProps) {
  const timeUntilNext = Math.max(0, next.t - nowSeconds);
  const isActive = false; // Animation disabled
  
  return (
    <motion.div
      animate={isActive ? {
        scale: [1, 1.02, 1],
        transition: { duration: 0.5, repeat: Infinity }
      } : {}}
    >
      <Card className={`${isActive ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getTypeIcon(next.type)}
              Current Action
            </CardTitle>
            <div className="flex items-center gap-2">
              {next.category && (
                <Badge variant="outline" className="text-xs">
                  {next.category}
                </Badge>
              )}
              <Badge variant={getTypeColor(next.type) as any}>
                {next.type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg font-medium leading-relaxed">
            {next.text}
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground">
              {next.type === 'end' ? (
                <span className="text-green-600 font-medium">Complete</span>
              ) : timeUntilNext > 0 ? (
                <>Starting in <span className="font-mono font-bold">{formatETA(timeUntilNext)}</span></>
              ) : (
                <span className="text-green-600 font-medium">Active now</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              At {formatTime(next.t)}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}