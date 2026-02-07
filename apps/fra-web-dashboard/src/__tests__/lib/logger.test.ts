import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  const originalEnv = import.meta.env.PROD;

  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes messages with [FRA]', async () => {
    const { logger } = await import('@/lib/logger');
    logger.warn('test message');
    expect(console.warn).toHaveBeenCalledWith('[FRA] test message', '');
  });

  it('passes data as second argument', async () => {
    const { logger } = await import('@/lib/logger');
    const data = { key: 'value' };
    logger.error('test', data);
    expect(console.error).toHaveBeenCalledWith('[FRA] test', data);
  });

  it('warn and error always log', async () => {
    const { logger } = await import('@/lib/logger');
    logger.warn('warning');
    logger.error('error');
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
