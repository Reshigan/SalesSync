import axios from 'axios';

interface AIInsight {
  success: boolean;
  insight?: string;
  model?: string;
  timestamp?: string;
  error?: string;
  fallback?: string;
}

interface AIContext {
  salesData?: any;
  customerData?: any;
  timeframe?: string;
  inventoryData?: any;
  routeData?: any;
  performanceData?: any;
  campaignData?: any;
}

interface HealthCheck {
  status: string;
  models?: any[];
  error?: string;
  timestamp: string;
}

class AIService {
  private ollamaUrl: string;
  public model: string;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }

  async generateInsight(prompt: string, context: AIContext = {}): Promise<AIInsight> {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: this.buildPrompt(prompt, context),
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      });

      return {
        success: true,
        insight: response.data.response,
        model: this.model,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('AI Service Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        fallback: this.getFallbackInsight(prompt, context)
      };
    }
  }

  buildPrompt(prompt: string, context: AIContext): string {
    let fullPrompt = `You are a sales analytics expert for a van sales management system. `;
    
    if (context.salesData) {
      fullPrompt += `Current sales data: ${JSON.stringify(context.salesData)}. `;
    }
    
    if (context.customerData) {
      fullPrompt += `Customer information: ${JSON.stringify(context.customerData)}. `;
    }
    
    if (context.timeframe) {
      fullPrompt += `Time period: ${context.timeframe}. `;
    }
    
    fullPrompt += `${prompt}. Provide a concise, actionable insight in 2-3 sentences.`;
    
    return fullPrompt;
  }

  getFallbackInsight(prompt: string, context: AIContext): string {
    const fallbacks: Record<string, string> = {
      'sales_forecast': 'Based on historical trends, consider focusing on high-performing routes and customer segments for optimal results.',
      'customer_analysis': 'Regular customer engagement and personalized service typically drive retention and increased order values.',
      'inventory_optimization': 'Monitor fast-moving items and seasonal patterns to optimize inventory levels and reduce waste.',
      'route_optimization': 'Analyze delivery efficiency and customer density to optimize route planning and reduce operational costs.',
      'performance_analysis': 'Track key metrics like conversion rates, average order value, and customer satisfaction for performance insights.'
    };
    
    return fallbacks[prompt] || 'Focus on data-driven decisions and customer-centric strategies for improved sales performance.';
  }

  async generateSalesForecast(salesData: any, timeframe: string = '30 days'): Promise<AIInsight> {
    const prompt = `Analyze the sales data and provide a forecast for the next ${timeframe}. Include key trends and recommendations.`;
    return await this.generateInsight(prompt, { salesData, timeframe });
  }

  async analyzeCustomerBehavior(customerData: any): Promise<AIInsight> {
    const prompt = `Analyze customer behavior patterns and suggest strategies to improve customer retention and increase sales.`;
    return await this.generateInsight(prompt, { customerData });
  }

  async optimizeInventory(inventoryData: any, salesData: any): Promise<AIInsight> {
    const prompt = `Based on inventory levels and sales patterns, recommend inventory optimization strategies.`;
    return await this.generateInsight(prompt, { inventoryData, salesData });
  }

  async analyzeRoutePerformance(routeData: any): Promise<AIInsight> {
    const prompt = `Analyze route performance data and suggest optimizations for better efficiency and sales coverage.`;
    return await this.generateInsight(prompt, { routeData });
  }

  async generatePerformanceInsights(performanceData: any): Promise<AIInsight> {
    const prompt = `Analyze sales performance metrics and provide actionable insights for improvement.`;
    return await this.generateInsight(prompt, { performanceData });
  }

  async generateMarketingInsights(campaignData: any, salesData: any): Promise<AIInsight> {
    const prompt = `Analyze marketing campaign effectiveness and suggest improvements based on sales impact.`;
    return await this.generateInsight(prompt, { campaignData, salesData });
  }

  // Health check for AI service
  async healthCheck(): Promise<HealthCheck> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      return {
        status: 'healthy',
        models: response.data.models || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new AIService();