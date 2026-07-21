package com.kopang.app.domain.product;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kopang.app.domain.category.CategoryMapper;
import com.kopang.app.domain.category.CategoryDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AISimilarProductService {

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    private final ProductMapper productMapper;
    private final CategoryMapper categoryMapper;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 인메모리 추천 결과 캐시
    private final Map<Long, AIRecommendationResponseDTO> recommendCache = new ConcurrentHashMap<>();

    public AIRecommendationResponseDTO getAIRecommendations(Long productId) {
        return recommendCache.computeIfAbsent(productId, this::generateAIRecommendations);
    }

    public void warmupRecommendationsAsync(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) return;
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            for (Long id : productIds) {
                if (id != null && !recommendCache.containsKey(id)) {
                    try {
                        getAIRecommendations(id);
                    } catch (Exception e) {
                        log.warn("Warmup failed for productId {}: {}", id, e.getMessage());
                    }
                }
            }
        });
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void warmupTopProductsOnStartup() {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                log.info("Starting background AI recommendation cache warmup for top products...");
                List<ProductDTO> topProducts = productMapper.findProducts(null, null, "popular", 10, 0);
                for (ProductDTO p : topProducts) {
                    Long id = (long) p.getProductId();
                    getAIRecommendations(id);
                }
                log.info("Completed background AI recommendation cache warmup for top 10 products.");
            } catch (Exception e) {
                log.warn("Startup AI recommendation warmup failed: {}", e.getMessage());
            }
        });
    }

    private AIRecommendationResponseDTO generateAIRecommendations(Long productId) {
        ProductDTO current = productMapper.findById(productId);
        if (current == null) {
            return new AIRecommendationResponseDTO(Collections.emptyList(), Collections.emptyList());
        }

        List<CategoryDTO> categories = categoryMapper.findAll();
        Map<Long, String> catMap = categories.stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(CategoryDTO::getId, CategoryDTO::getName, (a, b) -> a));

        String categoryName = catMap.getOrDefault((long) current.getCategoryId(), "기타");

        String similarKeyword = null;
        String togetherKeyword = null;

        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                String[] aiResult = askGeminiForKeywords(current.getName(), categoryName, current.getDescription());
                similarKeyword = aiResult[0];
                togetherKeyword = aiResult[1];
                log.info("Gemini AI extracted keywords for productId {}: similar='{}', together='{}'", productId, similarKeyword, togetherKeyword);
            } catch (Exception e) {
                log.warn("Gemini AI recommendation failed for productId {}, fallback to rules: {}", productId, e.getMessage());
            }
        }

        // Fallback or default keywords if AI is not available
        if (similarKeyword == null || similarKeyword.isBlank()) {
            similarKeyword = cleanKeyword(current.getName());
        }
        if (togetherKeyword == null || togetherKeyword.isBlank()) {
            togetherKeyword = getFallbackTogetherKeyword(categoryName);
        }

        // 1. Similar Products (같은 카테고리 + 유사 키워드 + 유사 가격대, 자기자신 제외)
        List<ProductDTO> simRaw = productMapper.findSimilarProducts(productId, (long) current.getCategoryId(), current.getPrice(), 12);
        List<ProductResponseDTO> similarList = simRaw.stream()
                .map(ProductResponseDTO::from)
                .limit(6)
                .collect(Collectors.toList());

        // 2. Frequently Bought Together Products (AI가 추천한 보완재/연관 용품 키워드로 검색)
        List<ProductDTO> togetherRaw = productMapper.findProducts(null, togetherKeyword, "popular", 12, 0);
        List<ProductResponseDTO> togetherList = togetherRaw.stream()
                .filter(p -> (long) p.getProductId() != productId)
                .map(ProductResponseDTO::from)
                .limit(6)
                .collect(Collectors.toList());

        // 보완재 검색 결과가 6개 미만이면 전체 인기상품으로 채우기
        if (togetherList.size() < 6) {
            List<ProductDTO> popRaw = productMapper.findProducts(null, null, "popular", 12, 0);
            for (ProductDTO p : popRaw) {
                if ((long) p.getProductId() != productId && togetherList.stream().noneMatch(t -> t.getId().equals((long) p.getProductId()))) {
                    togetherList.add(ProductResponseDTO.from(p));
                    if (togetherList.size() >= 6) break;
                }
            }
        }

        return new AIRecommendationResponseDTO(similarList, togetherList);
    }

    private String[] askGeminiForKeywords(String productName, String categoryName, String description) throws Exception {
        String prompt = String.format("""
                당신은 빠른 추천 AI 엔진입니다. Thinking 과정 없이 즉시 단어 2개만 JSON으로 출력하세요.
                - 상품명: %s
                - 카테고리: %s

                반드시 아래 JSON 형식으로만 답변하세요:
                {
                  "similarKeyword": "대체상품 키워드 1단어",
                  "togetherKeyword": "연관용품 키워드 1단어"
                }
                """, productName, categoryName);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> bodyMap = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "maxOutputTokens", 256,
                        "temperature", 0.2
                )
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(bodyMap, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String rawJson = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
            rawJson = rawJson.replaceAll("```json", "").replaceAll("```", "").trim();

            JsonNode json = objectMapper.readTree(rawJson);
            String sim = json.path("similarKeyword").asText("").trim();
            String tog = json.path("togetherKeyword").asText("").trim();
            return new String[]{sim, tog};
        }
        throw new IllegalStateException("Gemini API return status: " + response.getStatusCode());
    }

    private String cleanKeyword(String name) {
        if (name == null) return "";
        return name.replaceAll("\\(.*?\\)", "").replaceAll("\\[.*?\\]", "").trim();
    }

    private String getFallbackTogetherKeyword(String categoryName) {
        if (categoryName.contains("자전거") || categoryName.contains("스포츠")) return "장갑";
        if (categoryName.contains("가전") || categoryName.contains("디지털")) return "케이블";
        if (categoryName.contains("패션")) return "양말";
        if (categoryName.contains("뷰티")) return "크림";
        return "용품";
    }
}
