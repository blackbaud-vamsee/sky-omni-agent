package com.blackbaud.skyomni.controller;

import com.blackbaud.skyomni.agent.MedicAgent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/medic")
@RequiredArgsConstructor
public class MedicController {

    private final MedicAgent medicAgent;

    /**
     * POST /api/medic/diagnose
     *
     * Body: { "log": "...paste raw error log here..." }
     * Response: Server-Sent Events stream of diagnostic tokens
     *
     * curl example:
     *   curl -X POST http://localhost:8080/api/medic/diagnose \
     *        -H "Content-Type: application/json" \
     *        -d '{"log":"[ERROR] LuminateApi: GiftService.processGift() - NullReferenceException at..."}'
     */
    @PostMapping(value = "/diagnose", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> diagnose(@RequestBody LogRequest request) {
        return medicAgent.diagnose(request.log());
    }

    record LogRequest(String log) {}
}
