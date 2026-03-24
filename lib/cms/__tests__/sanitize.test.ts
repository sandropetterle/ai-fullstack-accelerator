jest.mock('isomorphic-dompurify', () => ({
  sanitize: (html: string) => {
    // Strip script tags and event handlers — minimal sanitization for unit test
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/ on\w+="[^"]*"/gi, '')
      .replace(/<a\s[^>]*href="javascript:[^"]*"[^>]*>(.*?)<\/a>/gi, '$1');
  },
  __esModule: true,
  default: {
    sanitize: (html: string) => {
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/ on\w+="[^"]*"/gi, '')
        .replace(/<a\s[^>]*href="javascript:[^"]*"[^>]*>(.*?)<\/a>/gi, '$1');
    },
  },
}));

import { describe, it, expect } from '@jest/globals';
import { sanitizeCmsHtml } from '../sanitize';

describe('sanitizeCmsHtml', () => {
  it('strips script tags', () => {
    const result = sanitizeCmsHtml('<p>Hello</p><script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Hello</p>');
  });

  it('strips inline event handlers', () => {
    const result = sanitizeCmsHtml('<p onclick="alert(1)">click me</p>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('<p>');
  });

  it('passes through safe HTML unchanged', () => {
    const safe = '<h2>Title</h2><p>Some <strong>bold</strong> text.</p><ul><li>item</li></ul>';
    const result = sanitizeCmsHtml(safe);
    expect(result).toBe(safe);
  });

  it('strips javascript: href', () => {
    const result = sanitizeCmsHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeCmsHtml('')).toBe('');
  });
});
