/**
 * Competitor Service Tests
 */

const competitorService = require('../../services/competitor.service');

// Mock the database functions
jest.mock('../../utils/database', () => ({
  getQuery: jest.fn(),
  getOneQuery: jest.fn(),
  runQuery: jest.fn()
}));

const { getQuery, getOneQuery, runQuery } = require('../../utils/database');

describe('CompetitorService', () => {
  const mockTenantId = 'tenant-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompetitors', () => {
    it('should return competitors with pagination', async () => {
      const mockCompetitors = [
        { id: '1', name: 'Competitor A', market_share: 25 },
        { id: '2', name: 'Competitor B', market_share: 20 }
      ];
      
      getQuery.mockResolvedValueOnce(mockCompetitors);
      getOneQuery.mockResolvedValueOnce({ total: 2 });
      
      const result = await competitorService.getCompetitors(mockTenantId, {
        limit: 50,
        offset: 0
      });
      
      expect(result.competitors).toEqual(mockCompetitors);
      expect(result.total).toBe(2);
      expect(getQuery).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      getQuery.mockResolvedValueOnce([]);
      getOneQuery.mockResolvedValueOnce({ total: 0 });
      
      await competitorService.getCompetitors(mockTenantId, {
        status: 'active'
      });
      
      expect(getQuery).toHaveBeenCalledWith(
        expect.stringContaining('status = ?'),
        expect.arrayContaining(['active'])
      );
    });
  });

  describe('getCompetitorById', () => {
    it('should return competitor with related data', async () => {
      const mockCompetitor = { id: '1', name: 'Competitor A' };
      const mockProducts = [{ id: 'p1', name: 'Product 1' }];
      const mockPriceHistory = [{ id: 'ph1', price: 100 }];
      const mockActivities = [{ id: 'a1', activity_type: 'promotion' }];
      
      getOneQuery.mockResolvedValueOnce(mockCompetitor);
      getQuery
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce(mockPriceHistory)
        .mockResolvedValueOnce(mockActivities);
      
      const result = await competitorService.getCompetitorById(mockTenantId, '1');
      
      expect(result.name).toBe('Competitor A');
      expect(result.products).toEqual(mockProducts);
      expect(result.priceHistory).toEqual(mockPriceHistory);
      expect(result.activities).toEqual(mockActivities);
    });

    it('should return null if competitor not found', async () => {
      getOneQuery.mockResolvedValueOnce(null);
      
      const result = await competitorService.getCompetitorById(mockTenantId, 'nonexistent');
      
      expect(result).toBeNull();
    });
  });

  describe('createCompetitor', () => {
    it('should create a new competitor', async () => {
      runQuery.mockResolvedValueOnce({ lastID: 1 });
      
      const data = {
        name: 'New Competitor',
        market_share: 15,
        status: 'active'
      };
      
      const result = await competitorService.createCompetitor(mockTenantId, data);
      
      expect(result.name).toBe('New Competitor');
      expect(result.id).toBeDefined();
      expect(runQuery).toHaveBeenCalled();
    });
  });

  describe('updateCompetitor', () => {
    it('should update competitor and return updated data', async () => {
      const mockUpdated = { id: '1', name: 'Updated Competitor' };
      
      runQuery.mockResolvedValueOnce({ changes: 1 });
      getOneQuery.mockResolvedValueOnce(mockUpdated);
      getQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      
      const result = await competitorService.updateCompetitor(mockTenantId, '1', {
        name: 'Updated Competitor'
      });
      
      expect(runQuery).toHaveBeenCalled();
    });
  });

  describe('deleteCompetitor', () => {
    it('should delete competitor', async () => {
      runQuery.mockResolvedValueOnce({ changes: 1 });
      
      const result = await competitorService.deleteCompetitor(mockTenantId, '1');
      
      expect(result.deleted).toBe(true);
      expect(runQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM competitors'),
        ['1', mockTenantId]
      );
    });
  });

  describe('getMarketShareAnalysis', () => {
    it('should return market share analysis', async () => {
      const mockCompetitors = [
        { id: '1', name: 'Competitor A', market_share: 25, avg_price_index: 105, recent_activities: 5 },
        { id: '2', name: 'Competitor B', market_share: 20, avg_price_index: 98, recent_activities: 2 }
      ];
      
      getQuery.mockResolvedValueOnce(mockCompetitors);
      
      const result = await competitorService.getMarketShareAnalysis(mockTenantId);
      
      expect(result.ourMarketShare).toBe(55); // 100 - 25 - 20
      expect(result.totalCompetitorShare).toBe(45);
      expect(result.competitors).toHaveLength(2);
      expect(result.competitors[0].trend).toBe('up'); // 5 activities > 3
      expect(result.competitors[1].trend).toBe('stable'); // 2 activities > 1
    });
  });

  describe('recordCompetitorActivity', () => {
    it('should record competitor activity', async () => {
      runQuery.mockResolvedValueOnce({ lastID: 1 });
      
      const data = {
        competitor_id: '1',
        activity_type: 'promotion',
        title: 'Summer Sale',
        impact_level: 'high'
      };
      
      const result = await competitorService.recordCompetitorActivity(mockTenantId, data);
      
      expect(result.title).toBe('Summer Sale');
      expect(result.id).toBeDefined();
      expect(runQuery).toHaveBeenCalled();
    });
  });

  describe('recordPriceObservation', () => {
    it('should record price observation and update product', async () => {
      runQuery.mockResolvedValue({ lastID: 1 });
      
      const data = {
        competitor_id: '1',
        product_id: 'p1',
        price: 99.99,
        price_index: 95
      };
      
      const result = await competitorService.recordPriceObservation(mockTenantId, data);
      
      expect(result.price).toBe(99.99);
      expect(runQuery).toHaveBeenCalledTimes(2); // Insert + Update product
    });
  });
});
