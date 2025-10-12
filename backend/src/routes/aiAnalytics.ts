import express, { Request, Response } from 'express';
import aiService from '../services/aiService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// AI Analytics Routes

// Generate sales forecast
router.post('/forecast', async (req: Request, res: Response) => {
  try {
    const { salesData, timeframe } = req.body;
    
    if (!salesData) {
      return res.status(400).json({ error: 'Sales data is required' });
    }

    const forecast = await aiService.generateSalesForecast(salesData, timeframe);
    
    res.json({
      success: true,
      forecast,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forecast generation error:', error);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// Analyze customer behavior
router.post('/customer-analysis',  async (req: Request, res: Response) => {
  try {
    const { customerData } = req.body;
    
    if (!customerData) {
      return res.status(400).json({ error: 'Customer data is required' });
    }

    const analysis = await aiService.analyzeCustomerBehavior(customerData);
    
    res.json({
      success: true,
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Customer analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze customer behavior' });
  }
});

// Inventory optimization insights
router.post('/inventory-optimization',  async (req: Request, res: Response) => {
  try {
    const { inventoryData, salesData } = req.body;
    
    if (!inventoryData || !salesData) {
      return res.status(400).json({ error: 'Inventory and sales data are required' });
    }

    const optimization = await aiService.optimizeInventory(inventoryData, salesData);
    
    res.json({
      success: true,
      optimization,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Inventory optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize inventory' });
  }
});

// Route performance analysis
router.post('/route-analysis',  async (req: Request, res: Response) => {
  try {
    const { routeData } = req.body;
    
    if (!routeData) {
      return res.status(400).json({ error: 'Route data is required' });
    }

    const analysis = await aiService.analyzeRoutePerformance(routeData);
    
    res.json({
      success: true,
      analysis,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Route analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze route performance' });
  }
});

// Performance insights
router.post('/performance-insights',  async (req: Request, res: Response) => {
  try {
    const { performanceData } = req.body;
    
    if (!performanceData) {
      return res.status(400).json({ error: 'Performance data is required' });
    }

    const insights = await aiService.generatePerformanceInsights(performanceData);
    
    res.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Performance insights error:', error);
    res.status(500).json({ error: 'Failed to generate performance insights' });
  }
});

// Marketing insights
router.post('/marketing-insights',  async (req: Request, res: Response) => {
  try {
    const { campaignData, salesData } = req.body;
    
    if (!campaignData || !salesData) {
      return res.status(400).json({ error: 'Campaign and sales data are required' });
    }

    const insights = await aiService.generateMarketingInsights(campaignData, salesData);
    
    res.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Marketing insights error:', error);
    res.status(500).json({ error: 'Failed to generate marketing insights' });
  }
});

// General AI insight generation
router.post('/generate-insight',  async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const insight = await aiService.generateInsight(prompt, context || {});
    
    res.json({
      success: true,
      insight,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Insight generation error:', error);
    res.status(500).json({ error: 'Failed to generate insight' });
  }
});

// AI service health check
router.get('/health',  async (req: Request, res: Response) => {
  try {
    const health = await aiService.healthCheck();
    res.json(health);
  } catch (error) {
    console.error('AI health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      status: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Get available AI models
router.get('/models',  async (req: Request, res: Response) => {
  try {
    const health = await aiService.healthCheck();
    res.json({
      success: true,
      models: health.models || [],
      currentModel: aiService.model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Models fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch available models' });
  }
});

export default router;