package com.blackbaud.skyomni.config;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.data.document.loader.UrlDocumentLoader;
import dev.langchain4j.data.document.parser.TextDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.bgesmallenv15q.BgeSmallEnV15QuantizedEmbeddingModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URL;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Configuration
public class RagConfig {

    // ----------------------------------------------------------------
    // Shared local embedding model — runs fully in-process via ONNX
    // No external API call, no API key needed for embeddings
    // ----------------------------------------------------------------
    @Bean
    public EmbeddingModel embeddingModel() {
        log.info("Loading BGE-Small-EN quantized embedding model (local ONNX)...");
        return new BgeSmallEnV15QuantizedEmbeddingModel();
    }

    // ----------------------------------------------------------------
    // Helper: load all documents from a classpath directory
    // 0.36.x has no ClassPathDocumentLoader — resolve via URL then
    // delegate to FileSystemDocumentLoader
    // ----------------------------------------------------------------
    private List<Document> loadClasspathDocuments(String classpathDir) {
        try {
            URL url = getClass().getClassLoader().getResource(classpathDir);
            if (url == null) {
                log.warn("Classpath directory not found: {} — no documents loaded", classpathDir);
                return List.of();
            }
            Path dir = Path.of(url.toURI());
            return FileSystemDocumentLoader.loadDocuments(dir, new TextDocumentParser());
        } catch (Exception e) {
            log.error("Failed to load documents from classpath directory: {}", classpathDir, e);
            return List.of();
        }
    }

    // ----------------------------------------------------------------
    // Public SKY UX documentation pages to ingest.
    // Add any additional component pages here.
    // ----------------------------------------------------------------
    private static final List<String> SKYUX_DOCS_URLS = List.of(
        // Developer/API tabs — have TypeScript types, imports, inputs/outputs
        "https://developer.blackbaud.com/skyux/components/button?docs-active-tab=development",
        "https://developer.blackbaud.com/skyux/components/modal?docs-active-tab=development",
        "https://developer.blackbaud.com/skyux/components/input-box?docs-active-tab=development",
        "https://developer.blackbaud.com/skyux/components/lookup?docs-active-tab=development",
        "https://developer.blackbaud.com/skyux/components/datepicker?docs-active-tab=development",
        "https://developer.blackbaud.com/skyux/components/data-grid?docs-active-tab=development",
        "https://developer.blackbaud.com/skyux/components/dropdown?docs-active-tab=development",
        "https://developer.blackbaud.com/skyux/components/toolbar?docs-active-tab=development",
        "https://developer.blackbaud.com/skyux/components/repeater?docs-active-tab=development",
        // Design/usage tabs — have "use when", anatomy, options
        "https://developer.blackbaud.com/skyux/components/modal",
        "https://developer.blackbaud.com/skyux/components/lookup",
        "https://developer.blackbaud.com/skyux/components/data-grid",
        "https://developer.blackbaud.com/skyux/design/guidelines/form-design",
        "https://developer.blackbaud.com/skyux/design/guidelines/page-layouts"
    );

    // ----------------------------------------------------------------
    // Helper: load documents from a list of URLs, skipping failures
    // ----------------------------------------------------------------
    private List<Document> loadUrlDocuments(List<String> urls) {
        List<Document> docs = new ArrayList<>();
        for (String url : urls) {
            try {
                Document doc = UrlDocumentLoader.load(url, new TextDocumentParser());
                docs.add(doc);
                log.debug("Loaded SKY UX doc from URL: {}", url);
            } catch (Exception e) {
                log.warn("Could not load SKY UX doc from URL: {} — {}", url, e.getMessage());
            }
        }
        return docs;
    }

    // ================================================================
    // PIPELINE 1 — SKY UX Documentation store (for Architect agent)
    // ================================================================

    @Bean
    @Qualifier("skyuxEmbeddingStore")
    public InMemoryEmbeddingStore<TextSegment> skyuxEmbeddingStore() {
        return new InMemoryEmbeddingStore<>();
    }

    @Bean
    @Qualifier("skyuxContentRetriever")
    public ContentRetriever skyuxContentRetriever(
            @Qualifier("skyuxEmbeddingStore") InMemoryEmbeddingStore<TextSegment> store,
            EmbeddingModel embeddingModel) {

        // Load from classpath (your custom/internal docs)
        List<Document> localDocs = loadClasspathDocuments("docs/skyux");

        // Load from public SKY UX documentation site
        log.info("Fetching {} pages from developer.blackbaud.com/skyux ...", SKYUX_DOCS_URLS.size());
        List<Document> urlDocs = loadUrlDocuments(SKYUX_DOCS_URLS);

        List<Document> allDocs = new ArrayList<>();
        allDocs.addAll(localDocs);
        allDocs.addAll(urlDocs);

        log.info("Ingesting {} total SKY UX documents ({} local + {} from web) into embedding store...",
                allDocs.size(), localDocs.size(), urlDocs.size());

        EmbeddingStoreIngestor.builder()
                .documentSplitter(DocumentSplitters.recursive(500, 50))
                .embeddingModel(embeddingModel)
                .embeddingStore(store)
                .build()
                .ingest(allDocs);

        log.info("SKY UX RAG pipeline ready.");

        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(store)
                .embeddingModel(embeddingModel)
                .maxResults(5)
                .minScore(0.55)
                .build();
    }

    // ================================================================
    // PIPELINE 2 — Error patterns store (for Medic agent)
    // ================================================================

    @Bean
    @Qualifier("errorEmbeddingStore")
    public InMemoryEmbeddingStore<TextSegment> errorEmbeddingStore() {
        return new InMemoryEmbeddingStore<>();
    }

    @Bean
    @Qualifier("errorContentRetriever")
    public ContentRetriever errorContentRetriever(
            @Qualifier("errorEmbeddingStore") InMemoryEmbeddingStore<TextSegment> store,
            EmbeddingModel embeddingModel) {

        List<Document> docs = loadClasspathDocuments("docs/errors");

        log.info("Ingesting {} error pattern files into embedding store...", docs.size());

        EmbeddingStoreIngestor.builder()
                .documentSplitter(DocumentSplitters.recursive(500, 50))
                .embeddingModel(embeddingModel)
                .embeddingStore(store)
                .build()
                .ingest(docs);

        log.info("Error patterns RAG pipeline ready.");

        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(store)
                .embeddingModel(embeddingModel)
                .maxResults(5)
                .minScore(0.55)
                .build();
    }
}
