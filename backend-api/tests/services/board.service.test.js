const BoardService = require('../../src/services/board.service');

describe('BoardService', () => {
  describe('calculateCoverage', () => {
    it('should return 0 for null polygons', () => {
      expect(BoardService.calculateCoverage(null, null)).toBe(0);
      expect(BoardService.calculateCoverage(null, [])).toBe(0);
      expect(BoardService.calculateCoverage([], null)).toBe(0);
    });

    it('should return 0 for polygons with fewer than 3 points', () => {
      const twoPoints = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
      expect(BoardService.calculateCoverage(twoPoints, twoPoints)).toBe(0);
    });

    it('should return 0 when storefront area is 0', () => {
      const line = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
      const board = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0.5, y: 1 }];
      expect(BoardService.calculateCoverage(line, board)).toBe(0);
    });

    it('should calculate 100% coverage for equal polygons', () => {
      const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
      expect(BoardService.calculateCoverage(square, square)).toBe(100);
    });

    it('should calculate 50% coverage', () => {
      const storefront = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
      const board = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }];
      expect(BoardService.calculateCoverage(storefront, board)).toBe(50);
    });

    it('should calculate 25% coverage', () => {
      const storefront = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
      const board = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }];
      expect(BoardService.calculateCoverage(storefront, board)).toBe(25);
    });

    it('should round to 1 decimal place', () => {
      const storefront = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
      const board = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 3 }, { x: 0, y: 3 }];
      expect(BoardService.calculateCoverage(storefront, board)).toBe(30);
    });
  });

  describe('_calculatePolygonArea', () => {
    it('should calculate area of a unit square', () => {
      const square = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
      expect(BoardService._calculatePolygonArea(square)).toBe(1);
    });

    it('should calculate area of a 10x10 square', () => {
      const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
      expect(BoardService._calculatePolygonArea(square)).toBe(100);
    });

    it('should calculate area of a right triangle', () => {
      const triangle = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }];
      expect(BoardService._calculatePolygonArea(triangle)).toBe(6);
    });

    it('should calculate area of a rectangle', () => {
      const rect = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 3 }, { x: 0, y: 3 }];
      expect(BoardService._calculatePolygonArea(rect)).toBe(15);
    });

    it('should handle clockwise and counter-clockwise points', () => {
      const cw = [{ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 0 }];
      const ccw = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
      expect(BoardService._calculatePolygonArea(cw)).toBe(BoardService._calculatePolygonArea(ccw));
    });
  });
});
