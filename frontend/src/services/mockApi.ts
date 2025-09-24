import { SessionSummary, NextAction, Step, LatestImage } from '../types';

// Mock data generators - simplified timeline
const generateMockSteps = (totalSeconds: number): Step[] => {
  const steps: Step[] = [
    {
      id: 'step-1',
      tStart: 0,
      tEnd: 300,
      type: 'instruction',
      text: 'Prep all ingredients and mise en place',
      category: 'prep'
    },
    {
      id: 'step-2',
      tStart: 300,
      tEnd: 600,
      type: 'instruction',
      text: 'Heat pan and begin cooking',
      category: 'cook'
    },
    {
      id: 'step-3',
      tStart: 600,
      tEnd: 900,
      type: 'progress',
      text: 'Monitor cooking progress',
      category: 'cook'
    },
    {
      id: 'step-4',
      tStart: 900,
      tEnd: 1200,
      type: 'instruction',
      text: 'Season and adjust flavors',
      category: 'season'
    },
    {
      id: 'step-5',
      tStart: 1200,
      tEnd: 1500,
      type: 'progress',
      text: 'Final cooking adjustments',
      category: 'cook'
    },
    {
      id: 'step-6',
      tStart: 1500,
      tEnd: totalSeconds,
      type: 'end',
      text: 'Plate and serve',
      category: 'plate'
    }
  ];
  
  return steps;
};

const getStepText = (type: string, category: string): string => {
  const texts = {
    instruction: {
      prep: ['Dice the onions finely', 'Chop garlic and ginger', 'Wash and dry the vegetables'],
      cook: ['Heat oil in pan over medium heat', 'Add ingredients to the pan', 'Stir occasionally'],
      season: ['Add salt and pepper to taste', 'Sprinkle herbs evenly', 'Taste and adjust seasoning'],
      plate: ['Arrange on serving plate', 'Garnish with fresh herbs', 'Drizzle with sauce']
    },
    progress: {
      prep: ['Check prep work progress', 'Ensure all ingredients are ready', 'Verify cutting technique'],
      cook: ['Monitor cooking temperature', 'Check for doneness', 'Adjust heat as needed'],
      season: ['Taste for flavor balance', 'Check seasoning levels', 'Verify spice distribution'],
      plate: ['Review plating technique', 'Check presentation', 'Final quality check']
    }
  };
  
  const categoryTexts = texts[type as keyof typeof texts][category as keyof typeof texts.instruction];
  return categoryTexts[Math.floor(Math.random() * categoryTexts.length)];
};

export class MockApiService {
  private static instance: MockApiService;
  private mockData: Map<string, any> = new Map();
  
  static getInstance(): MockApiService {
    if (!this.instance) {
      this.instance = new MockApiService();
    }
    return this.instance;
  }
  
  constructor() {
    this.initializeMockData();
  }
  
  private initializeMockData() {
    // Demo session data
    const demoSummary: SessionSummary = {
      id: 'demo',
      dishName: 'Classic Beef Stir Fry',
      totalSeconds: 1800, // 30 minutes
      startedAt: new Date().toISOString(),
      status: 'idle'
    };
    
    const demoTimeline = generateMockSteps(1800);
    
    this.mockData.set('demo-summary', demoSummary);
    this.mockData.set('demo-timeline', demoTimeline);
  }
  
  async getSessionSummary(sessionId: string): Promise<SessionSummary> {
    await this.delay(100);
    return this.mockData.get(`${sessionId}-summary`) || {
      id: sessionId,
      dishName: 'Unknown Dish',
      totalSeconds: 1800,
      startedAt: new Date().toISOString(),
      status: 'idle'
    };
  }
  
  async getNextAction(sessionId: string): Promise<NextAction> {
    await this.delay(150);
    const timeline = this.mockData.get(`${sessionId}-timeline`) as Step[] || [];
    const sessionSummary = this.mockData.get(`${sessionId}-summary`);
    const now = Math.floor((Date.now() - new Date(sessionSummary?.startedAt || Date.now()).getTime()) / 1000);
    
    // Find the current or next step
    const currentStep = timeline.find(step => step.tStart <= now && (!step.tEnd || step.tEnd > now));
    const nextStep = timeline.find(step => step.tStart > now);
    const upcomingSteps = timeline.filter(step => step.tStart > now).slice(0, 3);
    
    // Use current step if active, otherwise use next step, otherwise session complete
    let activeStep;
    if (currentStep) {
      activeStep = currentStep;
    } else if (nextStep) {
      activeStep = nextStep;
    } else {
      activeStep = {
        tStart: now,
        type: 'end' as const,
        text: 'Session complete - all steps finished!',
        category: 'complete'
      };
    }
    
    return {
      nowSeconds: now,
      next: {
        t: activeStep.tStart,
        type: activeStep.type,
        text: activeStep.text,
        category: activeStep.category
      },
             queue: upcomingSteps
    };
  }
  
  async getTimeline(sessionId: string): Promise<Step[]> {
    await this.delay(100);
    return this.mockData.get(`${sessionId}-timeline`) || [];
  }
  
  async getLatestImages(sessionId: string): Promise<LatestImage[]> {
    await this.delay(200);
    const categories = ['prep', 'cook', 'season', 'plate'];
    return categories.map((category, index) => ({
      category,
      url: `https://images.unsplash.com/photo-${1600000000000 + index * 100000}?w=300&h=200&fit=crop&crop=center`,
      ts: Date.now() - (index * 60000) // Each image 1 minute apart
    }));
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockApi = MockApiService.getInstance();