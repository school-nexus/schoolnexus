import { describe, it, expect, vi } from 'vitest';
import { hashPassword, comparePassword } from '@/lib/auth-utils';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'test123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should compare password correctly', async () => {
      const password = 'test123';
      const hashed = await hashPassword(password);
      
      const isValid = await comparePassword(password, hashed);
      const isInvalid = await comparePassword('wrongpassword', hashed);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });
});