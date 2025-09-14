// Color utilities for consistent theming across components

export const stepTypeColors = {
  instruction: {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    badge: 'default' as const
  },
  progress: {
    bg: 'bg-amber-500',
    text: 'text-amber-50',
    badge: 'secondary' as const
  },
  end: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-50',
    badge: 'outline' as const
  }
};

export const categoryColors = {
  prep: 'border-l-blue-500',
  cook: 'border-l-orange-500',
  season: 'border-l-green-500',
  plate: 'border-l-purple-500',
  default: 'border-l-gray-500'
};

export const categoryBadgeColors = {
  prep: 'bg-blue-500',
  cook: 'bg-orange-500',
  season: 'bg-green-500',
  plate: 'bg-purple-500',
  default: 'bg-gray-500'
};

export const statusColors = {
  running: 'bg-green-500',
  paused: 'bg-amber-500',
  completed: 'bg-emerald-500',
  idle: 'bg-gray-500'
};

export const logTypeColors = {
  instruction: 'text-primary bg-primary/10',
  progress: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
  system: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  default: 'text-muted-foreground bg-muted'
};