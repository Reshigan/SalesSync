const CommissionService = require('../../src/services/commission.service');

describe('CommissionService', () => {
  describe('calculateCommission', () => {
    it('should return 0 when no rules provided', () => {
      expect(CommissionService.calculateCommission('order', {}, null)).toBe(0);
      expect(CommissionService.calculateCommission('order', {}, undefined)).toBe(0);
    });

    it('should calculate flat commission', () => {
      const rules = { type: 'flat', amount: 10 };
      expect(CommissionService.calculateCommission('board_placement', {}, rules)).toBe(10);
    });

    it('should calculate flat commission with string amount', () => {
      const rules = { type: 'flat', amount: '25.50' };
      expect(CommissionService.calculateCommission('board_placement', {}, rules)).toBe(25.50);
    });

    it('should return 0 for flat with no amount', () => {
      const rules = { type: 'flat' };
      expect(CommissionService.calculateCommission('board_placement', {}, rules)).toBe(0);
    });

    it('should calculate per_unit commission', () => {
      const rules = { type: 'per_unit', amount: 0.50 };
      const eventData = { quantity: 100 };
      expect(CommissionService.calculateCommission('product_distribution', eventData, rules)).toBe(50);
    });

    it('should default quantity to 1 for per_unit', () => {
      const rules = { type: 'per_unit', amount: 5 };
      expect(CommissionService.calculateCommission('product_distribution', {}, rules)).toBe(5);
    });

    it('should calculate percentage commission from total_amount', () => {
      const rules = { type: 'percentage', percentage: 5 };
      const eventData = { total_amount: 1000 };
      expect(CommissionService.calculateCommission('order', eventData, rules)).toBe(50);
    });

    it('should calculate percentage commission from sale_amount', () => {
      const rules = { type: 'percentage', percentage: 10 };
      const eventData = { sale_amount: 500 };
      expect(CommissionService.calculateCommission('order', eventData, rules)).toBe(50);
    });

    it('should return 0 for percentage with no amount', () => {
      const rules = { type: 'percentage', percentage: 5 };
      expect(CommissionService.calculateCommission('order', {}, rules)).toBe(0);
    });

    it('should return 0 for unknown rule type', () => {
      const rules = { type: 'unknown' };
      expect(CommissionService.calculateCommission('order', {}, rules)).toBe(0);
    });
  });

  describe('_calculateTieredCommission', () => {
    it('should return 0 when no tiers', () => {
      expect(CommissionService._calculateTieredCommission({}, null)).toBe(0);
      expect(CommissionService._calculateTieredCommission({}, undefined)).toBe(0);
      expect(CommissionService._calculateTieredCommission({}, 'not-array')).toBe(0);
    });

    it('should select correct tier by quantity', () => {
      const tiers = [
        { threshold: 0, type: 'flat', amount: 5 },
        { threshold: 10, type: 'flat', amount: 10 },
        { threshold: 50, type: 'flat', amount: 25 },
      ];
      expect(CommissionService._calculateTieredCommission({ quantity: 5 }, tiers)).toBe(5);
      expect(CommissionService._calculateTieredCommission({ quantity: 15 }, tiers)).toBe(10);
      expect(CommissionService._calculateTieredCommission({ quantity: 100 }, tiers)).toBe(25);
    });

    it('should select correct tier by amount', () => {
      const tiers = [
        { threshold: 0, type: 'percentage', percentage: 3 },
        { threshold: 1000, type: 'percentage', percentage: 5 },
        { threshold: 5000, type: 'percentage', percentage: 8 },
      ];
      const result = CommissionService._calculateTieredCommission({ total_amount: 2000 }, tiers);
      expect(result).toBe(100);
    });

    it('should return 0 for empty tiers array', () => {
      expect(CommissionService._calculateTieredCommission({ quantity: 10 }, [])).toBe(0);
    });
  });

  describe('calculateCommission with tiered rules', () => {
    it('should delegate to tiered calculation', () => {
      const rules = {
        type: 'tiered',
        tiers: [
          { threshold: 0, type: 'flat', amount: 5 },
          { threshold: 100, type: 'flat', amount: 20 },
        ],
      };
      const eventData = { quantity: 150 };
      expect(CommissionService.calculateCommission('order', eventData, rules)).toBe(20);
    });
  });
});
