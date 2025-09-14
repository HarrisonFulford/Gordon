export interface Step {
  id: string;
  tStart: number;
  tEnd?: number;
  type: 'instruction' | 'progress' | 'end';
  text: string;
  category?: string;
}

export interface SessionSummary {
  id: string;
  dishName: string;
  totalSeconds: number;
  startedAt: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
}

export interface NextAction {
  nowSeconds: number;
  next: {
    t: number;
    type: 'instruction' | 'progress' | 'end';
    text: string;
    category?: string;
  };
  queue: Step[];
}

export interface LatestImage {
  category: string;
  url: string;
  ts: number;
}

export interface LogEntry {
  ts: number;
  icon: string;
  msg: string;
  type: 'instruction' | 'progress' | 'end' | 'system' | 'gordon_response';
}

export interface WSMessage {
  nowSeconds: number;
  lastAction?: string;
  next3: Step[];
  logEntry?: LogEntry;
}