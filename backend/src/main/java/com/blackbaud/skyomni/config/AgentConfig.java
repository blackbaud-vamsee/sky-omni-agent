package com.blackbaud.skyomni.config;

import com.blackbaud.skyomni.agent.ArchitectAgent;
import com.blackbaud.skyomni.agent.MedicAgent;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Manually wires each @AiService to its dedicated ContentRetriever.
 *
 * The Spring Boot starter's auto-wiring injects a single ContentRetriever bean.
 * Since we have two (skyux vs errors), we wire each agent explicitly here.
 */
@Configuration
public class AgentConfig {

    @Bean
    public ArchitectAgent architectAgent(
            StreamingChatLanguageModel streamingChatModel,
            @Qualifier("skyuxContentRetriever") ContentRetriever skyuxContentRetriever) {

        return AiServices.builder(ArchitectAgent.class)
                .streamingChatLanguageModel(streamingChatModel)
                .contentRetriever(skyuxContentRetriever)
                .build();
    }

    @Bean
    public MedicAgent medicAgent(
            StreamingChatLanguageModel streamingChatModel,
            @Qualifier("errorContentRetriever") ContentRetriever errorContentRetriever) {

        return AiServices.builder(MedicAgent.class)
                .streamingChatLanguageModel(streamingChatModel)
                .contentRetriever(errorContentRetriever)
                .build();
    }
}
