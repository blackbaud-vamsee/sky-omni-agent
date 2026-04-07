import { Injectable } from '@angular/core';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Observable } from 'rxjs';

export type AgentMode = 'architect' | 'medic';

@Injectable({ providedIn: 'root' })
export class SseAgentService {

  /**
   * Stream tokens from the SKY-Omni Agent backend via POST-based SSE.
   * Uses @microsoft/fetch-event-source so we can send a POST body
   * (native EventSource only supports GET).
   *
   * @param mode   'architect' → /api/architect/generate
   *               'medic'     → /api/medic/diagnose
   * @param input  The user's prompt or log text
   */
  stream(mode: AgentMode, input: string): Observable<string> {
    const url = mode === 'architect' ? '/api/architect/generate' : '/api/medic/diagnose';
    const bodyKey = mode === 'architect' ? 'prompt' : 'log';

    return new Observable<string>(observer => {
      const controller = new AbortController();

      fetchEventSource(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [bodyKey]: input }),
        signal: controller.signal,

        onmessage(event) {
          if (event.data) {
            observer.next(event.data);
          }
        },

        onclose() {
          observer.complete();
        },

        onerror(err) {
          observer.error(err);
          // Returning to prevent auto-retry
          throw err;
        }
      });

      // Cleanup: abort the SSE connection when unsubscribed
      return () => controller.abort();
    });
  }
}
