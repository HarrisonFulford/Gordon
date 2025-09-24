import { useEffect } from 'react';

interface KeyboardShortcuts {
  onSpaceBar?: () => void;
  onKeyR?: () => void;
  onKeyL?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement ||
          (e.target as HTMLElement)?.contentEditable === 'true') {
        return;
      }
      
      // Handle different key combinations
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          shortcuts.onSpaceBar?.();
          break;
        case 'r':
          if (!e.metaKey && !e.ctrlKey) { // Avoid conflict with browser refresh
            e.preventDefault();
            shortcuts.onKeyR?.();
          }
          break;
        case 'l':
          if (!e.metaKey && !e.ctrlKey) { // Avoid conflict with address bar focus
            e.preventDefault();
            shortcuts.onKeyL?.();
          }
          break;
        case 'escape':
          e.preventDefault();
          shortcuts.onEscape?.();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [shortcuts]);
}