/**
 * API service for Gordon backend integration
 */

const API_BASE_URL = 'http://localhost:5001/api';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  ingredients: string[];
  imageUrl: string;
  timeline?: TimelineStep[];
}

export interface TimelineStep {
  id: string;
  tStart: number;
  tEnd?: number;
  type: 'instruction' | 'progress' | 'end';
  text: string;
  category?: string;
}

export interface SessionStatus {
  session_active: boolean;
  webcam_running: boolean;
  pid?: number;
  categories: {
    [category: string]: {
      count: number;
      latest?: string;
      latest_time: number;
    };
  };
}

export interface CategoryData {
  category: string;
  images: {
    filename: string;
    path: string;
    modified: number;
  }[];
  count: number;
}

class GordonAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    return response.json();
  }

  /**
   * Generate recipes from ingredient image
   */
  async generateRecipes(imageFile: File): Promise<{ recipes: Recipe[] }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/recipes/generate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Recipe generation failed');
    }

    return response.json();
  }

  /**
   * Start cooking session (starts webcam capture)
   */
  async startSession() {
    const response = await fetch(`${this.baseUrl}/session/start`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start session');
    }

    return response.json();
  }

  /**
   * Stop cooking session (stops webcam capture)
   */
  async stopSession() {
    const response = await fetch(`${this.baseUrl}/session/stop`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop session');
    }

    return response.json();
  }

  /**
   * Get session status
   */
  async getSessionStatus(): Promise<SessionStatus> {
    const response = await fetch(`${this.baseUrl}/session/status`);
    
    if (!response.ok) {
      throw new Error('Failed to get session status');
    }

    return response.json();
  }

  /**
   * Get all categories with stats
   */
  async getCategories() {
    const response = await fetch(`${this.baseUrl}/categories`);
    
    if (!response.ok) {
      throw new Error('Failed to get categories');
    }

    return response.json();
  }

  /**
   * Get images for a specific category
   */
  async getCategoryImages(category: string): Promise<CategoryData> {
    const response = await fetch(`${this.baseUrl}/categories/${category}/images`);
    
    if (!response.ok) {
      throw new Error(`Failed to get images for category: ${category}`);
    }

    return response.json();
  }

  /**
   * Get image URL for serving
   */
  getCategoryImageUrl(category: string, filename: string): string {
    return `${this.baseUrl}/categories/${category}/image/${filename}`;
  }
}

// Export singleton instance
export const gordonAPI = new GordonAPI(); 