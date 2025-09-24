import { useState } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { motion } from 'motion/react';

interface ImageItem {
  category: string;
  url: string;
  ago: number; // milliseconds ago
}

interface ImageMasonryProps {
  items: ImageItem[];
  className?: string;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'prep': return 'bg-blue-500';
    case 'cook': return 'bg-orange-500';
    case 'season': return 'bg-green-500';
    case 'plate': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const formatTimeAgo = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

export function ImageMasonry({ items, className = '' }: ImageMasonryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  const handleImageLoad = (url: string) => {
    setLoadedImages(prev => new Set([...prev, url]));
  };
  
  if (items.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={`${item.url}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video">
                <ImageWithFallback
                  src={item.url}
                  alt={`${item.category} image`}
                  className="w-full h-full object-cover"
                  onLoad={() => handleImageLoad(item.url)}
                />
                {!loadedImages.has(item.url) && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}
                
                {/* Category badge overlay */}
                <div className="absolute top-2 left-2">
                  <Badge 
                    className={`${getCategoryColor(item.category)} text-white border-0`}
                  >
                    {item.category}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">
                    {item.category} Check
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(item.ago)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No images captured yet</p>
          <p className="text-sm">Images will appear as the session progresses</p>
        </div>
      )}
    </div>
  );
}