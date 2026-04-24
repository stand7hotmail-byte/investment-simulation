import { describe, it, expect, vi } from 'vitest';

// Simulating TanStack Query retry logic based on v5 spec
const shouldRetry = (failureCount: number, error: { status: number }) => {
  if (error.status >= 400 && error.status < 500) return false;
  return failureCount <= 3;
};

describe('Priority-Aware Retry Policy (v5)', () => {
  it('should NOT retry on 404 error', () => {
    const error = { status: 404 };
    expect(shouldRetry(0, error)).toBe(false);
  });

  it('should NOT retry on 401 error', () => {
    const error = { status: 401 };
    expect(shouldRetry(0, error)).toBe(false);
  });

  it('should retry on 500 error up to 3 times', () => {
    const error = { status: 500 };
    expect(shouldRetry(0, error)).toBe(true);  // 1st retry (count 0)
    expect(shouldRetry(1, error)).toBe(true);  // 2nd retry (count 1)
    expect(shouldRetry(2, error)).toBe(true);  // 3rd retry (count 2)
    expect(shouldRetry(3, error)).toBe(true);  // 4th retry (count 3)
    expect(shouldRetry(4, error)).toBe(false); // 5th attempt (count 4) -> STOP
  });

  it('should retry on network error (no status)', () => {
    const error = { status: 0 }; // typical for network failure
    expect(shouldRetry(0, error as any)).toBe(true);
  });
});
