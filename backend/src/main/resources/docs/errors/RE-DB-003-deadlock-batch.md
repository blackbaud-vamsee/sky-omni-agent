# Error Pattern: Raiser's Edge NXT — Database Deadlock on Batch Gift Import

## Error ID: RE-DB-003
## System: Raiser's Edge NXT (RE NXT) — Batch Processing Service
## Severity: HIGH

---

## Raw Log Sample
```
[2026-03-25 02:14:17] ERROR BatchGiftImportService - Batch import failed after 3 retries
Batch ID: BATCH-2026-0325-001432  |  Records attempted: 847  |  Records committed: 412
com.microsoft.sqlserver.jdbc.SQLServerException: Transaction (Process ID 87) was deadlocked
on lock resources with another process and has been chosen as the deadlock victim.
Rerun the transaction.
    at com.blackbaud.re.batch.GiftBatchProcessor.commitBatch(GiftBatchProcessor.java:302)
    at com.blackbaud.re.batch.GiftBatchProcessor.processBatch(GiftBatchProcessor.java:201)
    at com.blackbaud.re.scheduler.BatchImportScheduler.runNightlyImport(BatchImportScheduler.java:88)
Deadlock graph: spid87 → RE_Gifts table (IX lock) ← spid43 (ConstituentUpdateService)
```

---

## Root Cause
A SQL Server deadlock between the nightly batch import job and the constituent update service.
Both processes attempt to acquire incompatible locks on the `RE_Gifts` and `RE_Constituents` tables
in opposite order:
- Batch import: locks `RE_Gifts` → then `RE_Constituents`
- Constituent update: locks `RE_Constituents` → then `RE_Gifts`

This is a classic "resource ordering" deadlock.

---

## Fix

**Option A (Preferred): Enforce consistent lock ordering**

Modify the constituent update service to always lock `RE_Gifts` before `RE_Constituents`:
```sql
-- Add explicit table hint to constituent update queries
UPDATE RE_Constituents WITH (ROWLOCK, UPDLOCK)
SET LastModifiedDate = GETUTCDATE()
WHERE ConstituentId = @id
```

**Option B: Use SNAPSHOT isolation on the batch read phase**
```java
// In GiftBatchProcessor, set transaction isolation for the read phase:
@Transactional(isolation = Isolation.SNAPSHOT)
public List<GiftRecord> loadPendingBatch(String batchId) { ... }
```

**Option C (Quick workaround): Stagger job schedules**
Shift `BatchImportScheduler` to run at 02:00 and `ConstituentUpdateService` to run at 04:00
to eliminate overlap during off-peak hours.

---

## Prevention
- Document lock ordering rules in the DB schema README
- Add deadlock detection to the batch scheduler: catch `SQLServerException` with error code 1205
  and implement exponential backoff retry (max 5 attempts, 2^n seconds)
- Monitor `sys.dm_exec_query_stats` for frequent deadlock waits
