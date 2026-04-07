package com.blackbaud.skyomni.controller;

import com.blackbaud.skyomni.agent.ArchitectAgent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/architect")
@RequiredArgsConstructor
public class ArchitectController {

    private final ArchitectAgent architectAgent;

    /**
     * POST /api/architect/generate
     *
     * Body: { "prompt": "Create a paginated donor list grid with search" }
     * Response: Server-Sent Events stream of tokens
     *
     * curl example:
     *   curl -X POST http://localhost:8080/api/architect/generate \
     *        -H "Content-Type: application/json" \
     *        -d '{"prompt":"Create a SKY UX data grid showing donors with name, amount, and date columns"}'
     */
    @PostMapping(value = "/generate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> generate(@RequestBody PromptRequest request) {
        return architectAgent.generate(request.prompt());
    }

    record PromptRequest(String prompt) {}
}
