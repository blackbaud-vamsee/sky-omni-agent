# Error Pattern: SKY API — OAuth Token Expiry / 401 Unauthorized

## Error ID: SKY-AUTH-002
## System: SKY API (OAuth 2.0 / BBAuth)
## Severity: CRITICAL

---

## Raw Log Sample
```
[2026-03-20 14:55:03] ERROR SkyApiClient - SKY API request failed
Request: GET https://api.sky.blackbaud.com/constituent/v1/constituents/123456
Response: 401 Unauthorized
{
  "statusCode": 401,
  "message": "Authorization has been denied for this request.",
  "errorCode": "TOKEN_EXPIRED"
}
com.blackbaud.skyapi.client.SkyApiClient.executeRequest(SkyApiClient.java:134)
com.blackbaud.skyapi.client.SkyApiClient.getConstituent(SkyApiClient.java:67)
    at com.blackbaud.integration.service.ConstituentSyncService.syncConstituent(ConstituentSyncService.java:55)
```

---

## Root Cause
The application is using a cached OAuth access token that has expired (SKY API tokens expire after
60 minutes). The token refresh logic is either:
1. Missing entirely (token fetched once at startup)
2. Not triggering on 401 responses (no retry-with-refresh interceptor)

---

## Fix

Implement a token refresh interceptor in the HTTP client:

```java
// SkyApiTokenInterceptor.java
public class SkyApiTokenInterceptor implements ClientHttpRequestInterceptor {

    private final SkyApiAuthService authService;
    private volatile String cachedToken;
    private volatile Instant tokenExpiry;

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body,
                                         ClientHttpRequestExecution execution) throws IOException {
        request.getHeaders().setBearerAuth(getValidToken());
        ClientHttpResponse response = execution.execute(request, body);

        // Retry once on 401 with freshly obtained token
        if (response.getStatusCode() == HttpStatus.UNAUTHORIZED) {
            cachedToken = null; // invalidate
            request.getHeaders().setBearerAuth(getValidToken());
            response = execution.execute(request, body);
        }
        return response;
    }

    private String getValidToken() {
        if (cachedToken == null || Instant.now().isAfter(tokenExpiry.minusSeconds(60))) {
            OAuthToken token = authService.fetchNewToken();
            cachedToken = token.getAccessToken();
            tokenExpiry = Instant.now().plusSeconds(token.getExpiresIn());
        }
        return cachedToken;
    }
}
```

Register the interceptor on your `RestTemplate` or `WebClient`.

---

## Prevention
- Never store OAuth tokens in-memory without an expiry check
- Use `WebClient` with `ExchangeFilterFunction` for reactive stacks — same pattern applies
- Set up alerting when 401 error rate exceeds 1% of SKY API calls
