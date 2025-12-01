import { RequestQueue } from '../../../extension/features/ai/aiProcessor.js';
import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";

/**
 * Tests for RequestQueue class in aiProcessor.js
 */

describe('RequestQueue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with correct rate limits', () => {
      const queue = new RequestQueue();

      expect(queue.rateLimits.gemini.rpm).toBe(15);
      expect(queue.rateLimits.cerebras.rpm).toBe(60);
      expect(queue.rateLimits.groq.rpm).toBe(30);
    });

    it('should initialize with correct queue size limits', () => {
      const queue = new RequestQueue();

      expect(queue.rateLimits.gemini.maxQueueSize).toBe(100);
      expect(queue.rateLimits.cerebras.maxQueueSize).toBe(200);
      expect(queue.rateLimits.groq.maxQueueSize).toBe(150);
    });

    it('should initialize with priority levels', () => {
      const queue = new RequestQueue();

      expect(queue.priorities.high).toBe(0);
      expect(queue.priorities.normal).toBe(1);
      expect(queue.priorities.low).toBe(2);
    });

    it('should initialize metrics', () => {
      const queue = new RequestQueue();

      expect(queue.metrics.totalRequests).toBe(0);
      expect(queue.metrics.successfulRequests).toBe(0);
      expect(queue.metrics.failedRequests).toBe(0);
      expect(queue.metrics.throttledRequests).toBe(0);
    });

    it('should initialize provider metrics', () => {
      const queue = new RequestQueue();

      expect(queue.metrics.providerMetrics.has('gemini')).toBe(true);
      expect(queue.metrics.providerMetrics.has('cerebras')).toBe(true);
      expect(queue.metrics.providerMetrics.has('groq')).toBe(true);
    });
  });

  describe('Priority Ordering', () => {
    it('should order requests by priority', () => {
      const queue = new RequestQueue();
      queue._processQueue = jest.fn();

      queue.enqueue(async () => 'low', 'gemini', 'low');
      queue.enqueue(async () => 'high', 'gemini', 'high');
      queue.enqueue(async () => 'normal', 'gemini', 'normal');

      expect(queue.queue[0].priorityName).toBe('high');
      expect(queue.queue[1].priorityName).toBe('normal');
      expect(queue.queue[2].priorityName).toBe('low');
    });
  });

  describe('Queue Size Limits', () => {
    it('should reject requests when queue is full', () => {
      const queue = new RequestQueue();
      queue.queue = new Array(100).fill({});

      expect(() => {
        queue.enqueue(async () => 'test', 'gemini', 'normal');
      }).rejects.toThrow('Queue full');
    });

    it('should track throttled requests', () => {
      const queue = new RequestQueue();
      queue.queue = new Array(100).fill({});

      const initialThrottled = queue.metrics.throttledRequests;

      try {
        queue.enqueue(async () => 'test', 'gemini', 'normal');
      } catch (e) {
      }

      expect(queue.metrics.throttledRequests).toBeGreaterThan(initialThrottled);
    });
  });

  describe('Retry Logic', () => {
    it('should have correct retry configuration', () => {
      const queue = new RequestQueue();

      expect(queue.retryConfig.maxRetries).toBe(3);
      expect(queue.retryConfig.baseDelay).toBe(1000);
      expect(queue.retryConfig.maxDelay).toBe(30000);
      expect(queue.retryConfig.jitterFactor).toBe(0.3);
    });

    it('should calculate exponential backoff delay', () => {
      const queue = new RequestQueue();

      const delay1 = queue._calculateRetryDelay(1);
      const delay2 = queue._calculateRetryDelay(2);
      const delay3 = queue._calculateRetryDelay(3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should apply jitter to retry delays', () => {
      const queue = new RequestQueue();

      const delays = [];
      for (let i = 0; i < 10; i++) {
        delays.push(queue._calculateRetryDelay(1));
      }

      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('should cap retry delay at maxDelay', () => {
      const queue = new RequestQueue();

      const delay = queue._calculateRetryDelay(10);

      expect(delay).toBeLessThanOrEqual(queue.retryConfig.maxDelay * 1.3);
    });
  });

  describe('Metrics', () => {
    it('should track total requests', () => {
      const queue = new RequestQueue();
      queue._processQueue = jest.fn();

      queue.enqueue(async () => 'test1', 'gemini', 'normal');
      queue.enqueue(async () => 'test2', 'gemini', 'normal');

      expect(queue.metrics.totalRequests).toBe(2);
    });

    it('should provide metrics summary', () => {
      const queue = new RequestQueue();
      const metrics = queue.getMetrics();

      expect(metrics).toHaveProperty('queueDepth');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successfulRequests');
      expect(metrics).toHaveProperty('failedRequests');
      expect(metrics).toHaveProperty('retriedRequests');
      expect(metrics).toHaveProperty('throttledRequests');
      expect(metrics).toHaveProperty('averageWaitTime');
      expect(metrics).toHaveProperty('requestsPerMinute');
      expect(metrics).toHaveProperty('providers');
    });

    it('should track provider-specific metrics', () => {
      const queue = new RequestQueue();
      const metrics = queue.getMetrics();

      expect(metrics.providers).toHaveProperty('gemini');
      expect(metrics.providers).toHaveProperty('cerebras');
      expect(metrics.providers).toHaveProperty('groq');

      expect(metrics.providers.gemini).toHaveProperty('requests');
      expect(metrics.providers.gemini).toHaveProperty('successful');
      expect(metrics.providers.gemini).toHaveProperty('failed');
      expect(metrics.providers.gemini).toHaveProperty('throttled');
      expect(metrics.providers.gemini).toHaveProperty('rpm');
      expect(metrics.providers.gemini).toHaveProperty('rpmLimit');
    });

    it('should clear metrics', () => {
      const queue = new RequestQueue();
      queue._processQueue = jest.fn();

      queue.enqueue(async () => 'test', 'gemini', 'normal');
      queue.clearMetrics();

      expect(queue.metrics.totalRequests).toBe(0);
      expect(queue.requestHistory.size).toBe(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should track requests per minute per provider', () => {
      const queue = new RequestQueue();
      const now = Date.now();

      queue.requestHistory.set(now, 'gemini');
      queue.requestHistory.set(now - 1000, 'gemini');
      queue.requestHistory.set(now - 2000, 'cerebras');

      queue._updateRequestsPerMinute();

      const metrics = queue.getMetrics();
      expect(metrics.requestsPerMinute.gemini).toBe(2);
      expect(metrics.requestsPerMinute.cerebras).toBe(1);
    });

    it('should enforce RPM limits', async () => {
      const queue = new RequestQueue();
      const now = Date.now();

      for (let i = 0; i < 15; i++) {
        queue.requestHistory.set(now - i * 1000, 'gemini');
      }

      const canProcess = await queue._canProcessRequest('gemini', queue.rateLimits.gemini);

      expect(canProcess).toBe(false);
    });
  });
});
