import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, calculateGrade, isValidEmail } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      // Intl.NumberFormat with 'en-UG' and 'UGX' returns 'USh\u00A01,000' in this environment
      expect(formatCurrency(1000)).toMatch(/USh.*1,000/);
      expect(formatCurrency(1000000)).toMatch(/USh.*1,000,000/);
      expect(formatCurrency(1234.56)).toMatch(/USh.*1,235/);
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      // Just check if it contains the month and year, day might vary by timezone
      expect(formatDate(date, 'short')).toMatch(/Jan/);
      expect(formatDate(date, 'short')).toMatch(/2024/);
    });
  });

  describe('calculateGrade', () => {
    it('should calculate grades correctly', () => {
      expect(calculateGrade(95, 100)).toBe('A+');
      expect(calculateGrade(85, 100)).toBe('A');
      expect(calculateGrade(75, 100)).toBe('B');
      expect(calculateGrade(65, 100)).toBe('C');
      expect(calculateGrade(55, 100)).toBe('D');
      expect(calculateGrade(45, 100)).toBe('F');
    });
  });

  describe('isValidEmail', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });
});