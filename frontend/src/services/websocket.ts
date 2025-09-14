import { WSMessage, LogEntry } from '../types';
import { mockApi } from './mockApi';

export class WebSocketService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private sessionId: string | null = null;
  private onMessageCallback: ((message: WSMessage) => void) | null = null;
  private onConnectionStatusCallback: ((connected: boolean) => void) | null = null;
  
  connect(sessionId: string, onMessage: (message: WSMessage) => void, onConnectionStatus: (connected: boolean) => void) {
    this.sessionId = sessionId;
    this.onMessageCallback = onMessage;
    this.onConnectionStatusCallback = onConnectionStatus;
    
    // For demo purposes, skip WebSocket and go directly to polling
    console.log('Using polling mode for reliable demo experience');
    this.startPolling();
  }
  
  // WebSocket methods removed - using polling mode for demo reliability
  
  private startPolling() {
    if (this.pollingInterval) return;
    
    // Set connection status to true for polling mode
    this.onConnectionStatusCallback?.(true);
    
    // Send initial update immediately
    this.sendPollingUpdate();
    
    this.pollingInterval = setInterval(() => {
      this.sendPollingUpdate();
    }, 2000);
  }
  
  private async sendPollingUpdate() {
    if (!this.sessionId) return;
    
    try {
      const nextAction = await mockApi.getNextAction(this.sessionId);
      const mockMessage: WSMessage = {
        nowSeconds: nextAction.nowSeconds,
        next3: nextAction.queue,
        logEntry: Math.random() > 0.7 ? this.generateMockLogEntry() : undefined
      };
      
      this.onMessageCallback?.(mockMessage);
    } catch (error) {
      console.error('Polling error:', error);
      this.onConnectionStatusCallback?.(false);
    }
  }
  
  // Mock WebSocket messages method removed - using polling mode
  
  private generateMockLogEntry(): LogEntry {
    const logTypes = ['instruction', 'progress', 'system'] as const;
    const messages = {
      instruction: ['Starting next cooking step', 'Please proceed with preparation', 'Time to move to the next phase'],
      progress: ['Checking cooking progress', 'Monitoring temperature', 'Evaluating doneness'],
      system: ['Timer updated', 'Recipe step completed', 'System notification']
    };
    
    const type = logTypes[Math.floor(Math.random() * logTypes.length)];
    const typeMessages = messages[type];
    
    return {
      ts: Date.now(),
      icon: type === 'instruction' ? 'chef-hat' : type === 'progress' ? 'clock' : 'info',
      msg: typeMessages[Math.floor(Math.random() * typeMessages.length)],
      type
    };
  }
  
  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.sessionId = null;
    this.onMessageCallback = null;
    this.onConnectionStatusCallback = null;
  }
}

export const wsService = new WebSocketService();