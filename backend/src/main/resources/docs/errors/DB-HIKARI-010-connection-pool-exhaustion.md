# DB-HIKARI-010 — HikariCP Connection Pool Exhaustion in Scheduled RE NXT Sync

## Error Signature

```
java.lang.RuntimeException: Unable to acquire JDBC Connection
  at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.acquireConnectionIfNeeded

Caused by: com.zaxxer.hikari.pool.HikariPool$PoolTimeoutException:
  HikariPool-1 - Connection is not available, request timed out after 30000ms.
  Active connections: 10/10 (pool exhausted)
  Pending threads: 23
  Avg active transaction duration: 847s  ← CRITICAL (expected: <5s)
```

## Context

Occurs in Blackbaud RE NXT / Luminate integrations where a scheduled job (ConstituentSyncScheduler,
GiftBatchProcessor, or SolicitationRollupJob) iterates over thousands of records and calls a
`@Transactional` service method **inside a loop**. Each iteration borrows a JDBC connection from
HikariCP and — due to transaction propagation rules — holds it open for the entire loop body,
exhausting the pool before the batch completes.

Web request threads hitting the same datasource then queue behind `connection-timeout` (default 30s)
and surface as HTTP 503 / request timeouts to end users.

---

## TRIAGE

**Severity:** P1 — service outage. All web requests requiring DB access will fail once pool is exhausted.

**Immediate blast radius:**
- All `/api/**` endpoints that touch the DB return HTTP 500 or time out
- Scheduled jobs queue up, compounding the issue on next trigger
- HikariPool alert: `Thread starvation or clock leap detected`

**Confirming indicators:**
1. `Active connections: N/N` where N = `spring.datasource.hikari.maximum-pool-size`
2. `Avg active transaction duration` >> 5 seconds in pool metrics
3. Spike in `hikari.connections.pending` metric in Datadog / Actuator `/actuator/metrics/hikari.connections.pending`
4. Thread dump shows majority of threads blocked on `HikariPool.getConnection()`

---

## ROOT CAUSE

### Pattern A — @Transactional inside a loop (most common)

```java
// BAD — each call to processConstituent() borrows a connection AND holds it
// because the outer method is also @Transactional, Spring reuses the same
// transaction → connection held for entire loop duration
@Transactional   // ← outer transaction holds connection for ALL iterations
@Scheduled(cron = "0 0 * * * *")
public void runFullSync() {
    List<ConstituentDto> all = renxtApiClient.fetchAll(); // 5000+ records
    for (ConstituentDto c : all) {
        constituentService.syncOne(c);  // @Transactional inside
    }
}
```

With `maximum-pool-size=10` and 5000 constituents, the single outer transaction holds 1 connection
for the entire runtime (e.g., 14 minutes). If 10 jobs run concurrently (or overlap on retrigger),
all 10 connections are consumed.

### Pattern B — Connection leak (missing close)

```java
// BAD — EntityManager created manually, never closed
EntityManager em = emFactory.createEntityManager();
em.persist(entity);
// em.close() never called → connection returned to pool only at GC
```

### Pattern C — Long-running query without timeout

A single query (missing index on `constituent_id`, full table scan on 2M rows) holds a connection
for minutes, same pool exhaustion effect.

---

## IMMEDIATE FIX

### Fix A — Break the outer transaction, isolate inner (recommended)

```java
// GOOD — outer method is NOT transactional; each syncOne() manages its own short transaction
@Scheduled(cron = "0 0 * * * *")
public void runFullSync() {
    List<ConstituentDto> all = renxtApiClient.fetchAll();
    for (ConstituentDto c : all) {
        constituentService.syncOne(c);  // commits + releases connection immediately
    }
}

// ConstituentService.java
@Transactional(timeout = 10)  // 10-second max per record
public void syncOne(ConstituentDto dto) {
    // short, focused transaction — connection held < 50ms
}
```

### Fix B — Use REQUIRES_NEW for inner transaction (when outer context exists)

```java
@Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 10)
public void syncOne(ConstituentDto dto) { ... }
```

**Warning:** REQUIRES_NEW suspends the outer transaction. Use only if you need the outer context.
Prefer removing the outer `@Transactional` instead.

### Fix C — Add query timeout globally

```properties
# application.properties
spring.jpa.properties.jakarta.persistence.query.timeout=8000
spring.datasource.hikari.connection-timeout=10000
spring.datasource.hikari.leak-detection-threshold=15000
```

### Fix D — Pool size increase (stop-gap only)

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
```

**Note:** This delays exhaustion but does NOT fix the root cause. Always combine with Fix A/B.

---

## PREVENTION

1. **Never annotate a method that calls a loop with @Transactional.** The transaction scope should
   match a single unit-of-work, not an entire batch.

2. **Enable HikariCP leak detection in non-prod environments:**
   ```properties
   spring.datasource.hikari.leak-detection-threshold=5000
   ```
   This logs a warning when a connection is held > 5 seconds.

3. **Add connection pool metrics to your dashboard:**
   - `hikari.connections.active` — should never stay at `maximum-pool-size`
   - `hikari.connections.pending` — alert when > 0 for > 10 seconds
   - `hikari.connections.timeout` — alert on any non-zero value

4. **Use Spring Batch for any job processing > 100 records.** It handles chunking, transaction
   scope, restart/retry, and connection lifecycle correctly:
   ```java
   @Bean
   public Step syncStep() {
       return stepBuilderFactory.get("syncStep")
           .<ConstituentDto, ConstituentEntity>chunk(50)  // 50 records per transaction
           .reader(renxtApiReader())
           .processor(constituentItemProcessor())
           .writer(constituentItemWriter())
           .build();
   }
   ```

5. **Set `@Scheduled` `fixedDelay` instead of `fixedRate`** to prevent job overlap when a run
   takes longer than the interval.

---

## Related Errors

- `org.springframework.transaction.CannotCreateTransactionException` — same root cause, different JPA layer
- `Caused by: java.sql.SQLTransientConnectionException` — JDBC-level variant
- `BeanCreationException: Error creating bean 'entityManagerFactory'` — pool exhaustion during startup

## Affected Blackbaud Products

- RE NXT constituent / gift sync jobs
- Luminate Online event registration batch processors
- SKY API data export schedulers
- Any Spring Batch job sharing the primary datasource with web request threads
