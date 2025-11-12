# Request Queue Management System

## Overview

The `RequestQueue` class provides comprehensive queue management for AI API requests with provider-specific rate limiting, priority ordering, intelligent throttling, and detailed metrics tracking.

## Features

### 1. Provider-Specific Rate Limits

Rate limits are enforced per provider to comply with API quotas:

- **Gemini**: 15 requests/minute, max queue size 100
- **Cerebras**: 60 requests/minute, max queue size 200
- **Groq**: 30 requests/minute, max queue size 150

### 2. Priority Ordering

Requests are processed according to priority levels:

- **high** (0): Processed first (e.g., API key validation, category generation)
- **normal** (1): Standard priority for batch processing
- **low** (2): Background or non-urgent requests

### 3. Intelligent Throttling

- Enforces RPM limits per provider
- Calculates optimal wait times when rate limits are reached
- Tracks throttled request counts for monitoring
- Rejects requests when queue size limits are exceeded

### 4. Exponential Backoff Retry Logic

Failed requests are automatically retried with intelligent backoff:

- **Max retries**: 3 attempts
- **Base delay**: 1 second
- **Max delay**: 30 seconds
- **Jitter factor**: 30% randomization to prevent thundering herd

Retryable error conditions:
- Rate limit errors (429)
- Server errors (500, 502, 503, 504)
- Network timeouts
- Connection resets

### 5. Comprehensive Metrics

The system tracks detailed metrics for monitoring and optimization.

## Usage

### Enqueuing Requests

```javascript
// High priority request (category generation)
const response = await this.requestQueue.enqueue(
  async () => await fetch(url, options),
  'gemini',
  'high'
);
```

### Retrieving Metrics

```javascript
const metrics = aiProcessor.getQueueMetrics();
aiProcessor.displayQueueMetrics();
```

See full documentation in the code comments.
