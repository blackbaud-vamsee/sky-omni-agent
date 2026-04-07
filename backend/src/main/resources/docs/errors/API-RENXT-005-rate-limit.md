# Error Pattern: RE NXT API — 429 Rate Limit Exceeded During Batch Sync

## Error ID: API-RENXT-005
## System: Raiser's Edge NXT REST API — Constituent Sync Service
## Severity: HIGH

---

## Raw Log Sample
```
[2026-04-01 08:45:12.334] INFO  ConstituentSyncJob - Starting scheduled sync. Total records queued: 4821
[2026-04-01 08:45:13.021] INFO  ConstituentSyncJob - Processing batch 1/49 (records 1-100)
[2026-04-01 08:45:13.887] INFO  ConstituentSyncJob - Processing batch 2/49 (records 101-200)
[2026-04-01 08:45:14.203] INFO  ConstituentSyncJob - Processing batch 3/49 (records 201-300)
[2026-04-01 08:45:15.441] WARN  RENxtApiClient - Rate limit warning: 85% of hourly quota consumed
[2026-04-01 08:45:15.892] ERROR RENxtApiClient - HTTP 429 Too Many Requests
  URL: GET https://api.sky.blackbaud.com/constituent/v1/constituents?limit=100&offset=300
  Response Headers:
    Retry-After: 3600
    X-RateLimit-Limit: 5000
    X-RateLimit-Remaining: 0
    X-RateLimit-Reset: 1743497115
  Response Body: {"statusCode":429,"message":"Rate limit exceeded. Your application has exceeded the 5000 requests/hour limit."}

[2026-04-01 08:45:15.893] ERROR ConstituentSyncJob - Sync job aborted at batch 4/49.
  Records synced: 300 of 4821
  com.blackbaud.renxt.client.RateLimitException: RE NXT API rate limit hit during batch sync
    at com.blackbaud.renxt.client.RENxtApiClient.get(RENxtApiClient.java:134)
    at com.blackbaud.sync.ConstituentSyncJob.syncBatch(ConstituentSyncJob.java:88)
    at com.blackbaud.sync.ConstituentSyncJob.run(ConstituentSyncJob.java:61)
    at org.springframework.scheduling.support.ScheduledMethodRunnable.run(ScheduledMethodRunnable.java:84)
[2026-04-01 08:45:15.894] WARN  ConstituentSyncJob - 4521 records remain unsynced. Next run in 1 hour.
```

---

## Root Cause
The `ConstituentSyncJob` fires without rate-limit awareness and exhausts the RE NXT API quota
(5,000 req/hour) after only 300 records. The `RENxtApiClient` throws immediately on a 429 without
implementing exponential backoff or respecting the `Retry-After` header. The job does not resume
from the last committed offset on the next scheduled run — it restarts from scratch.

Compounding factors:
1. Other services (e.g. ReportingService, AuditService) share the same OAuth client ID, consuming
   part of the quota before the sync job starts
2. The job schedule (`@Scheduled(cron = "0 45 8 * * ?")`) coincides with peak API usage hours
3. No circuit breaker or quota pre-check before starting the batch

---

## Fix
Implement throttled batching with `Retry-After` respect and resumable state:

```java
// In RENxtApiClient — honor Retry-After on 429:
public <T> T get(String path, Class<T> responseType) {
    int attempts = 0;
    while (attempts < MAX_RETRIES) {
        ResponseEntity<T> response = restTemplate.getForEntity(path, responseType);
        if (response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
            long retryAfter = Long.parseLong(
                response.getHeaders().getFirst("Retry-After"));
            log.warn("Rate limited. Waiting {} seconds before retry.", retryAfter);
            Thread.sleep(retryAfter * 1000L);
            attempts++;
        } else {
            return response.getBody();
        }
    }
    throw new RateLimitException("Max retries exceeded after rate limiting");
}

// In ConstituentSyncJob — throttle requests and track offset:
@Value("${sync.requests-per-second:2}")
private int requestsPerSecond;

public void run() {
    int offset = syncStateRepository.getLastCommittedOffset();  // resumable
    RateLimiter rateLimiter = RateLimiter.create(requestsPerSecond);
    while (offset < totalRecords) {
        rateLimiter.acquire();  // Guava RateLimiter
        processBatch(offset);
        syncStateRepository.saveOffset(offset += BATCH_SIZE);
    }
}
```

---

## Prevention
- Use a dedicated OAuth client ID for the sync job (separate quota from UI API calls)
- Add pre-flight quota check: call `/subscriptions/v1/subscriptions` to get current usage
- Schedule the sync job during off-peak hours (e.g. 2:00 AM)
- Set `sync.requests-per-second=2` to stay well within 5000/hour across all services
- Add Prometheus metric: `renxt_api_rate_limit_hits_total` to alert before hitting quota
