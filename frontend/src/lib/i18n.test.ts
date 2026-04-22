import { describe, it, expect, vi } from 'vitest';
// These will fail to import initially
// @ts-ignore
import { translate, formatFinancialValue } from './i18n';

const mockEn = {
  common: {
    save: 'Save',
    greeting: 'Hello, {name}!',
  }
};

const mockJa = {
  common: {
    save: '保存',
    greeting: 'こんにちは、{name}！',
  }
};

describe('i18n logic', () => {
  describe('translate function', () => {
    it('should translate correctly in English', () => {
      expect(translate(mockEn, 'common.save')).toBe('Save');
    });

    it('should translate correctly in Japanese', () => {
      expect(translate(mockJa, 'common.save')).toBe('保存');
    });

    it('should handle variable replacement', () => {
      expect(translate(mockEn, 'common.greeting', { name: 'Gemini' })).toBe('Hello, Gemini!');
      expect(translate(mockJa, 'common.greeting', { name: 'Gemini' })).toBe('こんにちは、Gemini！');
    });

    it('should return the key if translation is missing', () => {
      expect(translate(mockEn, 'non.existent')).toBe('non.existent');
    });
  });

  describe('formatFinancialValue', () => {
    it('should format JPY with 0 decimals regardless of locale', () => {
      // JPY should have 0 fractional digits
      const enResult = formatFinancialValue(1000, 'JPY', 'en');
      const jaResult = formatFinancialValue(1000, 'JPY', 'ja');
      
      expect(enResult).toContain('1,000');
      expect(jaResult).toContain('1,000');
      
      expect(enResult).not.toContain('.');
      expect(jaResult).not.toContain('.');
    });

    it('should format USD with 2 decimals regardless of locale', () => {
      expect(formatFinancialValue(1000, 'USD', 'en')).toMatch(/\$1,000\.00/);
      // In Japanese UI, it might be formatted differently but should have 2 decimals if it's USD
      const jaResult = formatFinancialValue(1000, 'USD', 'ja');
      expect(jaResult).toContain('1,000.00');
    });

    it('should use correct separators for locale', () => {
      // Some locales use space or comma as separator. 
      // Japanese and US English both use comma for thousands.
      expect(formatFinancialValue(1000000, 'JPY', 'ja')).toContain('1,000,000');
    });
  });
});
