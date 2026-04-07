# Error Pattern: Spring Boot Startup — Circular Bean Dependency / BeanCreationException

## Error ID: SB-BOOT-008
## System: Spring Boot 3.x — Application Startup
## Severity: CRITICAL (application fails to start)

---

## Raw Log Sample
```
[2026-04-03 07:12:44.331] INFO  main — Starting SkyOmniAgentApplication
[2026-04-03 07:12:46.102] INFO  main — The following 1 profile is active: "prod"
[2026-04-03 07:12:48.771] INFO  main — Bootstrapping Spring Data JPA repositories in DEFAULT mode.
[2026-04-03 07:12:49.883] INFO  main — Finished Spring Data repository scanning in 210 ms.

[2026-04-03 07:12:51.444] ERROR main — Application run failed

org.springframework.beans.factory.BeanCurrentlyInCreationException: Error creating bean with name
'giftProcessingService': Requested bean is currently in creation: Is there an unresolvable circular
reference?
  at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry
      .beforeSingletonCreation(DefaultSingletonBeanRegistry.java:355)
  at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry
      .getSingleton(DefaultSingletonBeanRegistry.java:227)

The dependencies of some of the beans in the application context form a cycle:
  giftController
      ↓ depends on
  giftProcessingService (field private GiftProcessingService)
      ↓ depends on
  constituentService (field private ConstituentService)
      ↓ depends on
  auditService (field private AuditService)
      ↓ depends on
  giftProcessingService  ←← ← CIRCULAR

[2026-04-03 07:12:51.445] ERROR main — Unable to start the application context
[2026-04-03 07:12:51.446] INFO  main — Closing ConditionEvaluationReportLoggingListener$ConditionEvaluationReportListener
[2026-04-03 07:12:51.448] INFO  SpringApplication — Application startup failed, process exiting with code 1
```

---

## Root Cause
A circular dependency chain exists between four beans:
```
GiftProcessingService → ConstituentService → AuditService → GiftProcessingService
```

`AuditService` was recently updated to inject `GiftProcessingService` to look up gift metadata
when generating audit trail entries, creating the cycle. Spring cannot instantiate any of the
beans in the cycle because each requires the other to exist first.

---

## Fix

**Option 1 — Break the cycle with a domain event (preferred):**
Replace `AuditService`'s direct dependency on `GiftProcessingService` with a Spring
`ApplicationEventPublisher` pattern. Services publish events; audit subscribes to them.

```java
// In GiftProcessingService — publish an event instead of AuditService having a back-reference:
@Service
public class GiftProcessingService {
    private final ApplicationEventPublisher eventPublisher;

    public GiftRecord commitGift(GiftRequest req) {
        GiftRecord saved = giftRepository.save(buildGiftRecord(req));
        eventPublisher.publishEvent(new GiftCommittedEvent(saved.getId(), saved.getAmount()));
        return saved;
    }
}

// In AuditService — listen to events instead of injecting GiftProcessingService:
@Service
public class AuditService {
    @EventListener
    public void onGiftCommitted(GiftCommittedEvent event) {
        auditRepository.save(new AuditEntry("GIFT_COMMITTED", event.getGiftId()));
    }
}
```

**Option 2 — Use `@Lazy` to defer initialization (quick fix, not ideal):**
```java
@Service
public class AuditService {
    // Inject lazily — breaks the startup cycle but leaves the design issue in place
    private final GiftProcessingService giftService;

    public AuditService(@Lazy GiftProcessingService giftService) {
        this.giftService = giftService;
    }
}
```

---

## Prevention
- Draw a dependency graph before adding new `@Autowired` / constructor injections on existing services
- Add `spring.main.allow-circular-references=false` (the default in Spring Boot 3.x) to make
  circular deps fail at startup rather than silently using `@Lazy`
- Follow the rule: **services at the same layer should not inject each other**; use events or
  a shared lower-level service/repository to share data instead
