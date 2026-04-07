# Error Pattern: BBID / OAuth2 SSO — Redirect Loop (ERR_TOO_MANY_REDIRECTS)

## Error ID: AUTH-BBID-007
## System: Blackbaud ID (BBID) OAuth2 SSO — Spring Boot + Angular SPA
## Severity: CRITICAL

---

## Raw Log Sample
```
[2026-04-02 10:33:08.112] INFO  OAuth2LoginFilter - Initiating BBID OAuth2 authorization flow
  Redirect URI: https://myapp.blackbaud.net/oauth2/callback
  Scopes: openid profile email offline_access

[2026-04-02 10:33:08.998] INFO  OAuth2CallbackController - Received authorization code from BBID
  Code: bb_7f3a2e...
  State: c9b3f2d1-4a5e-11ed-b878-0242ac120002

[2026-04-02 10:33:09.341] INFO  OAuth2CallbackController - Exchanging code for access token — SUCCESS
  Subject: user-123456
  Expires in: 3600s

[2026-04-02 10:33:09.342] INFO  SecurityContextRepository - Storing authentication in session
  Session ID: E4F2A3B1C7D8E9F0

[2026-04-02 10:33:09.401] INFO  OAuth2LoginFilter - User authenticated. Redirecting to: /dashboard

[2026-04-02 10:33:09.450] INFO  OAuth2LoginFilter - Initiating BBID OAuth2 authorization flow
  Redirect URI: https://myapp.blackbaud.net/oauth2/callback
  [AUTH LOOP DETECTED — redirecting to BBID again within 100ms of completing authentication]

[2026-04-02 10:33:09.451] WARN  SessionManagementFilter - Session invalidated before security context could be stored. Creating new session.
  Old session: E4F2A3B1C7D8E9F0
  New session: A1B2C3D4E5F60718

[2026-04-02 10:33:09.452] ERROR CsrfFilter - Invalid CSRF token. Expected: 7d4f2a1b, Actual: null
  Request: GET /oauth2/callback

[2026-04-02 10:33:09.890] WARN  BrowserClient - ERR_TOO_MANY_REDIRECTS: Reached redirect limit for https://myapp.blackbaud.net/dashboard
  Redirects: /dashboard → /oauth2/authorize → /oauth2/callback → /dashboard → /oauth2/authorize (loop)
```

---

## Root Cause
The authentication works (token exchange succeeds) but the session is invalidated immediately
afterward by `SessionManagementFilter` before the security context is persisted. This happens because:

1. **Session fixation protection is triggering on the callback request**: Spring Security's default
   session fixation strategy (`migrateSession`) creates a *new* session ID after authentication.
   However, the callback URL still carries the pre-auth CSRF token tied to the OLD session, making
   subsequent requests appear unauthenticated.

2. **`SameSite=Strict` cookie policy blocks the callback**: The session cookie is set with
   `SameSite=Strict`. When BBID redirects back with the auth code, the browser doesn't send the
   existing session cookie on the cross-site redirect, so Spring Security sees no session and
   forces another login redirect.

3. **The `/dashboard` route is protected by a Spring Security filter** that checks authentication
   BEFORE the security context is stored in the migrated session, causing an infinite loop.

---

## Fix

```properties
# application.properties — fix SameSite cookie issue:
server.servlet.session.cookie.same-site=lax
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.http-only=true
```

```java
// SecurityConfig.java — fix session fixation + CSRF config for OAuth2 callbacks:
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl("/dashboard", true)
                .failureUrl("/login?error=true")
            )
            .sessionManagement(session -> session
                // Use newSession instead of migrateSession to avoid stale CSRF
                .sessionFixation().newSession()
                .maximumSessions(1)
            )
            .csrf(csrf -> csrf
                // Disable CSRF on OAuth2 callback endpoint only
                .ignoringRequestMatchers("/oauth2/callback")
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/oauth2/**", "/actuator/health").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

---

## Prevention
- Set `server.servlet.session.cookie.same-site=lax` in all environments (not `strict`)
- Add an integration test that simulates the full OAuth2 callback flow end-to-end
- Monitor for redirect counts in browser network logs in smoke tests (>3 redirects = loop)
- Set `logging.level.org.springframework.security=DEBUG` temporarily if debugging auth issues
