# Error Pattern: Email Notification Job — SMTP Connection Timeout / MailSendException

## Error ID: JOB-EMAIL-009
## System: Spring Boot Scheduled Job — Acknowledgment Receipt Email Service
## Severity: MEDIUM

---

## Raw Log Sample
```
[2026-04-04 06:00:02.114] INFO  AckEmailScheduler - Starting acknowledgment email batch. Pending: 1247
[2026-04-04 06:00:02.552] INFO  AckEmailScheduler - [1/1247] Sending gift receipt to: john.smith@email.com | Gift ID: GFT-449821
[2026-04-04 06:00:05.882] INFO  AckEmailScheduler - [2/1247] Sending gift receipt to: maria.jones@nonprofit.org | Gift ID: GFT-449822
[2026-04-04 06:00:09.110] INFO  AckEmailScheduler - [3/1247] Sending gift receipt to: donor@company.com | Gift ID: GFT-449823

[2026-04-04 06:00:15.031] ERROR AckEmailScheduler - Failed to send email for Gift ID: GFT-449824
org.springframework.mail.MailSendException: Failed messages:
  com.sun.mail.util.MailConnectException: Couldn't connect to host, port: smtp.sendgrid.net, 587; timeout -1;
  nestedExceptions are [
    com.sun.mail.util.MailConnectException: Couldn't connect to host, port: smtp.sendgrid.net, 587; timeout -1
      javax.mail.MessagingException: Exception reading response
        java.net.SocketTimeoutException: Read timed out
          at com.sun.mail.smtp.SMTPTransport.readResponse(SMTPTransport.java:1872)
  ]
  
[2026-04-04 06:00:15.032] WARN  AckEmailScheduler - Retry 1/3 for Gift ID: GFT-449824 in 30s
[2026-04-04 06:00:45.041] ERROR AckEmailScheduler - Retry 1/3 FAILED for Gift ID: GFT-449824
[2026-04-04 06:01:15.052] ERROR AckEmailScheduler - Retry 2/3 FAILED for Gift ID: GFT-449824
[2026-04-04 06:01:45.061] ERROR AckEmailScheduler - Retry 3/3 FAILED for Gift ID: GFT-449824

[2026-04-04 06:01:45.062] ERROR AckEmailScheduler - Gift ID: GFT-449824 moved to DEAD_LETTER queue after 3 failed attempts
[2026-04-04 06:01:45.063] INFO  AckEmailScheduler - Continuing with next record...
[2026-04-04 06:01:45.780] ERROR AckEmailScheduler - Failed to send email for Gift ID: GFT-449825
[... 1244 more sequential failures ...]
[2026-04-04 06:45:12.001] ERROR AckEmailScheduler - Batch complete: 3 sent, 1244 failed, 0 skipped
[2026-04-04 06:45:12.002] WARN  AckEmailScheduler - Dead letter queue size: 1244
```

---

## Root Cause
The SendGrid SMTP relay (`smtp.sendgrid.net:587`) became unreachable at 06:00:15. All subsequent
emails failed individually and each waited through 3 retries × 30-second delays before moving to
the dead-letter queue, causing the batch to take 45 minutes instead of its usual 3 minutes.

The `MailConnectException` with `timeout -1` indicates the default Java Mail socket timeout was
never configured — `timeout -1` means **blocking indefinitely** until the OS TCP timeout fires
(typically 2–3 minutes per attempt).

Contributing factors:
1. No circuit breaker — once the SMTP host becomes unreachable, the job should fail fast instead
   of retrying each individual email
2. No pre-flight connectivity check before starting the batch
3. Dead letter queue is only logged; no alert or requeue mechanism exists
4. SendGrid API key may have hit its monthly send limit (check the SendGrid dashboard)

---

## Fix

```properties
# application.properties — always configure explicit mail timeouts:
spring.mail.host=smtp.sendgrid.net
spring.mail.port=587
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000
spring.mail.properties.mail.smtp.starttls.enable=true
```

```java
// AckEmailScheduler.java — add circuit breaker and pre-flight check:
@Scheduled(cron = "0 0 6 * * ?")
public void sendAcknowledgments() {
    // Pre-flight: check SMTP connectivity before processing 1000+ records
    if (!mailHealthIndicator.isSmtpReachable()) {
        log.error("SMTP unreachable at batch start. Aborting. All {} pending emails remain queued.",
                  pendingQueue.size());
        alertService.notifyOps("EMAIL_BATCH_ABORTED", "SMTP host unreachable");
        return;  // fast-fail entire batch, retry next scheduled run
    }

    int consecutiveFailures = 0;
    for (PendingEmail email : pendingQueue.fetchAll()) {
        try {
            mailService.send(email);
            consecutiveFailures = 0;
            emailStatusRepository.markSent(email.getId());
        } catch (MailSendException e) {
            consecutiveFailures++;
            log.error("Email send failed for Gift {}: {}", email.getGiftId(), e.getMessage());
            deadLetterQueue.enqueue(email);
            // Circuit breaker: abort if 5 consecutive failures (likely SMTP down)
            if (consecutiveFailures >= 5) {
                log.error("5 consecutive failures. Aborting batch — SMTP likely down.");
                alertService.notifyOps("EMAIL_CIRCUIT_OPEN", "5 consecutive failures");
                break;
            }
        }
    }
}
```

---

## Prevention
- Always set `mail.smtp.connectiontimeout`, `mail.smtp.timeout`, and `mail.smtp.writetimeout`
- Add `/actuator/health` SMTP check using `spring-boot-actuator`
- Set up a PagerDuty/Teams alert when dead letter queue exceeds threshold
- Consider switching from SMTP to SendGrid's HTTP API (more reliable, easier to monitor)
