import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SseAgentService } from '../../services/sse-agent.service';

@Component({
  standalone: true,
  selector: 'app-medic',
  imports: [CommonModule, FormsModule],
  templateUrl: './medic.component.html',
  styleUrls: ['./medic.component.scss']
})
export class MedicComponent implements OnDestroy {

  logInput = '';
  output = '';
  isStreaming = false;
  hasError = false;
  errorMessage = '';

  /** Render markdown-style headings and code blocks for readable output */
  get formattedOutput(): string {
    return this.output
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // ## Heading
      .replace(/^## (.+)$/gm, '<strong class="diag-heading">$1</strong>')
      // `inline code`
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      // newlines
      .replace(/\n/g, '<br>');
  }

  // Short labels for the demo chip buttons (parallel array to demoLogs)
  readonly demoLabels = [
    'DB Pool Drain',
    'SKY UX Module',
    'Token Expired',
    'Rate Limit 429',
    'Form Undefined',
    'SQL Deadlock',
    'SSO Loop',
    'Circular Bean',
    'SMTP Timeout',
  ];

  // Demo logs for the hackathon presentation
  readonly demoLogs = [
    // --- 1. HikariCP connection pool exhaustion in scheduled RE NXT sync ---
    `[2026-04-06 09:15:33] ERROR c.b.sync.ConstituentSyncScheduler - Scheduled RE NXT full sync FAILED after 847s
[2026-04-06 09:15:33] ERROR o.s.orm.jpa.JpaTransactionManager - HikariPool-1 - Connection is not available, request timed out after 30000ms
java.lang.RuntimeException: Unable to acquire JDBC Connection
  at org.hibernate.resource.jdbc.internal.LogicalConnectionManagedImpl.acquireConnectionIfNeeded(LogicalConnectionManagedImpl.java:108)
  at com.blackbaud.renxt.sync.ConstituentBatchProcessor.processChunk(ConstituentBatchProcessor.java:187)
  at com.blackbaud.renxt.sync.ConstituentSyncScheduler.runFullSync(ConstituentSyncScheduler.java:94)
Caused by: com.zaxxer.hikari.pool.HikariPool\$PoolTimeoutException:
  HikariPool-1 - Connection is not available, request timed out after 30000ms.
  Active connections : 10/10  ← pool EXHAUSTED
  Pending threads   : 23
  Avg tx duration   : 847s   ← CRITICAL (normal: <5s)
  Total borrows     : 4,821 in last 300s
[2026-04-06 09:15:33] WARN  c.z.hikari.pool.ProxyLeakTask - Connection leak detected in ConstituentSyncScheduler.runFullSync()
[2026-04-06 09:15:33] WARN  HikariPool-1 - Thread starvation or clock leap detected (housekeeper delta=41023ms)
[2026-04-06 09:15:33] ERROR DispatcherServlet - 23 web API requests failed with HTTP 500 while pool was exhausted`,

    // --- 2. SKY UX Angular module not imported ---
    `ERROR in src/app/features/gift-form/gift-form.component.html:12:5
NG8001: 'sky-input-box' is not a known element:
  1. If 'sky-input-box' is an Angular component, verify it is included in @Component.imports.
  2. If it is a Web Component add 'CUSTOM_ELEMENTS_SCHEMA' to suppress this message.

ERROR in src/app/features/gift-form/gift-form.component.html:18:9
NG8001: 'sky-lookup' is not a known element.

ERROR in src/app/features/gift-form/gift-form.component.html:25:9
NG8002: Can't bind to 'labelText' since it isn't a known property of 'sky-input-box'.

src/app/features/gift-form/gift-form.component.ts:8
@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],  // missing SKY UX modules
})

Build failed with 3 errors.`,

    // --- 3. SKY API 401 token expiry (existing) ---
    `[2026-03-20 14:55:03] ERROR SkyApiClient - SKY API request failed
Request: GET https://api.sky.blackbaud.com/constituent/v1/constituents/123456
Response: 401 Unauthorized
{"statusCode": 401, "message": "Authorization has been denied for this request.", "errorCode": "TOKEN_EXPIRED"}`,

    // --- 4. RE NXT API 429 rate limit ---
    `[2026-04-01 08:45:15] ERROR RENxtApiClient - HTTP 429 Too Many Requests
  URL: GET https://api.sky.blackbaud.com/constituent/v1/constituents?limit=100&offset=300
  Response Headers:
    Retry-After: 3600
    X-RateLimit-Limit: 5000
    X-RateLimit-Remaining: 0
  Response Body: {"statusCode":429,"message":"Rate limit exceeded. Your application has exceeded the 5000 requests/hour limit."}

[2026-04-01 08:45:15] ERROR ConstituentSyncJob - Sync job aborted at batch 4/49.
  Records synced: 300 of 4821.
  com.blackbaud.renxt.client.RateLimitException: RE NXT API rate limit hit during batch sync
    at com.blackbaud.renxt.client.RENxtApiClient.get(RENxtApiClient.java:134)
    at com.blackbaud.sync.ConstituentSyncJob.syncBatch(ConstituentSyncJob.java:88)
[2026-04-01 08:45:15] WARN ConstituentSyncJob - 4521 records remain unsynced. Next run in 1 hour.`,

    // --- 5. Angular reactive form undefined crash ---
    `ERROR TypeError: Cannot read properties of undefined (reading 'value')
    at GiftEntryComponent.calculateTotal (gift-entry.component.ts:112)
    at GiftEntryComponent.ngOnInit (gift-entry.component.ts:67)
    at callHook (core.mjs:3583)

ERROR TypeError: Cannot read properties of null (reading 'get')
    at GiftEntryComponent.onAmountChange (gift-entry.component.ts:145)
    at HTMLInputElement.<anonymous> (gift-entry.component.html:31)

WARN Angular - ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked.
  Previous value: 'ng-untouched: true'
  Current value: 'ng-untouched: false'`,

    // --- 6. SQL deadlock (existing) ---
    `[2026-03-25 02:14:17] ERROR BatchGiftImportService - Batch import failed after 3 retries
com.microsoft.sqlserver.jdbc.SQLServerException: Transaction (Process ID 87) was deadlocked
on lock resources with another process and has been chosen as the deadlock victim.
Batch ID: BATCH-2026-0325-001432  |  Records attempted: 847  |  Records committed: 412`,

    // --- 7. BBID OAuth2 SSO redirect loop ---
    `[2026-04-02 10:33:09] INFO  OAuth2CallbackController - Authorization code exchange SUCCESS. Subject: user-123456
[2026-04-02 10:33:09] INFO  SecurityContextRepository - Storing authentication in session E4F2A3B1C7D8E9F0
[2026-04-02 10:33:09] WARN  SessionManagementFilter - Session invalidated before context stored. Creating new session.
[2026-04-02 10:33:09] ERROR CsrfFilter - Invalid CSRF token. Expected: 7d4f2a1b, Actual: null
  Request: GET /oauth2/callback
[2026-04-02 10:33:09] WARN  BrowserClient - ERR_TOO_MANY_REDIRECTS
  Loop: /dashboard → /oauth2/authorize → /oauth2/callback → /dashboard → /oauth2/authorize`,

    // --- 8. Spring Boot circular bean dependency ---
    `org.springframework.beans.factory.BeanCurrentlyInCreationException: Error creating bean with name
'giftProcessingService': Requested bean is currently in creation: Is there an unresolvable circular reference?

The dependencies of some of the beans in the application context form a cycle:
  giftController
      ↓ depends on
  giftProcessingService
      ↓ depends on
  constituentService
      ↓ depends on
  auditService
      ↓ depends on
  giftProcessingService  ←← ← CIRCULAR

[2026-04-03 07:12:51] ERROR main — Unable to start the application context. Process exiting with code 1`,

    // --- 9. SMTP timeout / email batch failure ---
    `[2026-04-04 06:00:15] ERROR AckEmailScheduler - Failed to send email for Gift ID: GFT-449824
org.springframework.mail.MailSendException: Failed messages:
  com.sun.mail.util.MailConnectException: Couldn't connect to host, port: smtp.sendgrid.net, 587; timeout -1
    javax.mail.MessagingException: Exception reading response
      java.net.SocketTimeoutException: Read timed out

[2026-04-04 06:01:45] ERROR AckEmailScheduler - Gift ID: GFT-449824 moved to DEAD_LETTER after 3 failed attempts
[... 1244 more sequential failures ...]
[2026-04-04 06:45:12] ERROR AckEmailScheduler - Batch complete: 3 sent, 1244 failed.
[2026-04-04 06:45:12] WARN  AckEmailScheduler - Dead letter queue size: 1244`
  ];

  private sub?: Subscription;

  constructor(private agentService: SseAgentService) {}

  diagnose(): void {
    if (!this.logInput.trim() || this.isStreaming) return;

    this.output = '';
    this.hasError = false;
    this.errorMessage = '';
    this.isStreaming = true;

    this.sub = this.agentService.stream('medic', this.logInput).subscribe({
      next: (token) => this.output += token,
      complete: () => { this.isStreaming = false; },
      error: (err) => {
        this.isStreaming = false;
        this.hasError = true;
        this.errorMessage = 'Failed to reach the backend. Is the Spring Boot server running on port 8080?';
        console.error('Medic stream error:', err);
      }
    });
  }

  useDemo(log: string): void {
    this.logInput = log;
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.isStreaming = false;
  }

  clear(): void {
    this.stop();
    this.logInput = '';
    this.output = '';
    this.hasError = false;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
