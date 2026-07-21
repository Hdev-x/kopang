package com.kopang.app.domain.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kopang.app.global.common.PageResponse;
import com.kopang.app.domain.category.CategoryDTO;
import com.kopang.app.domain.category.CategoryMapper;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AISearchService {

    private final ProductMapper productMapper;
    private final CategoryMapper categoryMapper;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, ParsedQuery> queryCache = new java.util.concurrent.ConcurrentHashMap<>();
    private List<CategoryDTO> cachedCategories = null;

    private synchronized List<CategoryDTO> getCategories() {
        if (cachedCategories == null) {
            cachedCategories = categoryMapper.findAll();
        }
        return cachedCategories;
    }

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    public PageResponse<ProductResponseDTO> search(String query, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return PageResponse.of(Collections.emptyList(), page, size, 0);
        }

        ParsedQuery parsed = parseQuery(query);
        log.info("Parsed query details: {}", parsed);

        // Extract backup keyword if parsed keyword is null/empty
        String keyword = parsed.getKeyword();
        if (keyword == null || keyword.trim().isEmpty()) {
            keyword = cleanQueryWithRules(query);
        }

        // Fetch all categories once to build a lookup map (prevents N+1 database queries)
        List<CategoryDTO> categories = getCategories();
        Map<Long, String> categoryMap = categories.stream()
                .filter(c -> c.getId() != null)
                .collect(Collectors.toMap(CategoryDTO::getId, CategoryDTO::getName, (a, b) -> a));

        // Fetch products (under category if specified)
        List<ProductDTO> rawProducts = productMapper.findProducts(parsed.getCategoryId(), null, "popular", 5000, 0);

        // Filter and Rank
        List<ScoredProduct> scoredProducts = new ArrayList<>();
        for (ProductDTO product : rawProducts) {
            // Price Filter
            int price = product.getDiscountPrice() > 0 ? product.getDiscountPrice() : product.getPrice();
            if (parsed.getMaxPrice() != null && price > parsed.getMaxPrice()) {
                continue;
            }
            if (parsed.getMinPrice() != null && price < parsed.getMinPrice()) {
                continue;
            }

            // Keyword filter and scoring
            int score = calculateRelevanceScore(product, keyword, categoryMap);
            if (keyword != null && !keyword.isEmpty() && score == 0) {
                // If a keyword is parsed but the product has 0 relevance score, filter it out
                continue;
            }

            scoredProducts.add(new ScoredProduct(product, score));
        }

        // Sort by score descending
        List<ProductDTO> sortedList = scoredProducts.stream()
                .sorted(Comparator.comparingInt(ScoredProduct::getScore).reversed())
                .map(ScoredProduct::getProduct)
                .collect(Collectors.toList());

        // Perform pagination (slicing)
        int totalElements = sortedList.size();
        int start = page * size;
        if (start >= totalElements) {
            return PageResponse.of(Collections.emptyList(), page, size, totalElements);
        }
        int end = Math.min(start + size, totalElements);
        List<ProductDTO> slicedList = sortedList.subList(start, end);

        List<ProductResponseDTO> content = slicedList.stream()
                .map(ProductResponseDTO::from)
                .collect(Collectors.toList());

        return PageResponse.of(content, page, size, totalElements);
    }

    private ParsedQuery parseQuery(String query) {
        String cleanQuery = query.trim().toLowerCase();
        return queryCache.computeIfAbsent(cleanQuery, q -> {
            if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
                try {
                    return parseQueryWithGemini(q);
                } catch (Exception e) {
                    log.warn("Gemini parsing failed, falling back to rule-based parser: {}", e.getMessage());
                }
            }
            return parseQueryWithRules(q);
        });
    }

    private ParsedQuery parseQueryWithGemini(String query) throws Exception {
        List<CategoryDTO> categories = getCategories();
        String categoriesList = categories.stream().map(CategoryDTO::getName).collect(Collectors.joining(", "));

        String systemPrompt = "You are a query parser for an e-commerce platform called Kopang.\n" +
                "Analyze the user's natural language search query and output a JSON object with these keys:\n" +
                "- \"categoryName\": a string matching one of the categories in the platform, or null.\n" +
                "- \"maxPrice\": integer representing the maximum price in KRW, or null.\n" +
                "- \"minPrice\": integer representing the minimum price in KRW, or null.\n" +
                "- \"keyword\": a clean search keyword string, or null.\n" +
                "\n" +
                "Available Category Names:\n" +
                categoriesList + "\n" +
                "\n" +
                "Respond ONLY with a JSON object. No markdown block wrappers like ```json.";

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Prepare request payload for Gemini
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", systemPrompt + "\n\nUser Query: " + query);

        Map<String, Object> parts = new HashMap<>();
        parts.put("parts", Collections.singletonList(textPart));

        Map<String, Object> contents = new HashMap<>();
        contents.put("contents", Collections.singletonList(parts));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        contents.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(contents, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map body = response.getBody();
            List candidates = (List) body.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map candidate = (Map) candidates.get(0);
                Map contentMap = (Map) candidate.get("content");
                if (contentMap != null) {
                    List partsList = (List) contentMap.get("parts");
                    if (partsList != null && !partsList.isEmpty()) {
                        Map part = (Map) partsList.get(0);
                        String rawJson = (String) part.get("text");
                        
                        // Clean markdown formatting if present
                        rawJson = rawJson.replaceAll("```json", "").replaceAll("```", "").trim();
                        
                        Map parsedJson = objectMapper.readValue(rawJson, Map.class);
                        String categoryName = (String) parsedJson.get("categoryName");
                        
                        Integer maxPrice = null;
                        if (parsedJson.get("maxPrice") != null) {
                            maxPrice = Integer.valueOf(String.valueOf(parsedJson.get("maxPrice")));
                        }
                        
                        Integer minPrice = null;
                        if (parsedJson.get("minPrice") != null) {
                            minPrice = Integer.valueOf(String.valueOf(parsedJson.get("minPrice")));
                        }
                        
                        String keyword = (String) parsedJson.get("keyword");
                        if (keyword != null) {
                            String trimmedLower = keyword.trim().toLowerCase();
                            if (trimmedLower.equals("상품") || trimmedLower.equals("제품") || trimmedLower.equals("물건") 
                                    || trimmedLower.equals("아이템") || trimmedLower.equals("품목") || trimmedLower.equals("것")
                                    || trimmedLower.equals("product") || trimmedLower.equals("item") || trimmedLower.equals("thing")) {
                                keyword = null;
                            }
                        }

                        Long categoryId = null;
                        if (categoryName != null) {
                            categoryId = findCategoryIdByName(categoryName);
                        }

                        return new ParsedQuery(categoryId, maxPrice, minPrice, keyword);
                    }
                }
            }
        }
        throw new IllegalStateException("Invalid response from Gemini API");
    }

    private ParsedQuery parseQueryWithRules(String query) {
        Long categoryId = null;
        Integer maxPrice = null;
        Integer minPrice = null;
        String keyword = null;

        // 1. Price analysis
        Pattern tenThousandPattern = Pattern.compile("(\\d+(\\.\\d+)?)\\s*만원");
        Matcher matcher = tenThousandPattern.matcher(query);
        double multiplier = 10000.0;
        double priceValue = -1.0;
        
        if (matcher.find()) {
            priceValue = Double.parseDouble(matcher.group(1)) * multiplier;
        } else {
            if (query.contains("만원")) {
                priceValue = 10000.0;
            } else {
                Pattern wonPattern = Pattern.compile("(\\d+)\\s*원");
                Matcher wonMatcher = wonPattern.matcher(query);
                if (wonMatcher.find()) {
                    priceValue = Double.parseDouble(wonMatcher.group(1));
                }
            }
        }

        if (priceValue > 0) {
            int intPrice = (int) priceValue;
            if (query.contains("이하") || query.contains("미만") || query.contains("이내") || query.contains("아래") || query.contains("안")) {
                maxPrice = intPrice;
            } else if (query.contains("이상") || query.contains("초과") || query.contains("위")) {
                minPrice = intPrice;
            } else if (query.contains("대")) {
                minPrice = intPrice;
                if (query.contains("만원")) {
                    maxPrice = intPrice + 9999;
                } else {
                    maxPrice = (int) (intPrice * 1.1);
                }
            } else {
                maxPrice = intPrice;
            }
        }

        // 2. Category analysis
        List<CategoryDTO> categories = getCategories();
        for (CategoryDTO cat : categories) {
            if (query.contains(cat.getName())) {
                categoryId = cat.getId();
                break;
            }
        }

        if (categoryId == null) {
            Map<String, String> synonyms = new HashMap<>();
            synonyms.put("과일", "신선식품");
            synonyms.put("야채", "신선식품");
            synonyms.put("채소", "신선식품");
            synonyms.put("고기", "신선식품");
            synonyms.put("생선", "신선식품");
            synonyms.put("반찬", "간편식");
            synonyms.put("옷", "남성의류");
            synonyms.put("바지", "남성의류");
            synonyms.put("티셔츠", "남성의류");
            synonyms.put("셔츠", "남성의류");
            synonyms.put("컴퓨터", "컴퓨터/노트북");
            synonyms.put("노트북", "컴퓨터/노트북");
            synonyms.put("폰", "모바일/태블릿");
            synonyms.put("핸드폰", "모바일/태블릿");
            synonyms.put("화장품", "스킨케어");
            synonyms.put("향수", "향수");
            synonyms.put("캠핑", "등산/캠핑/아웃도어");
            synonyms.put("등산", "등산/캠핑/아웃도어");
            synonyms.put("사료", "강아지 사료/간식");

            for (Map.Entry<String, String> entry : synonyms.entrySet()) {
                if (query.contains(entry.getKey())) {
                    categoryId = findCategoryIdByName(entry.getValue());
                    if (categoryId != null) break;
                }
            }
        }

        // 3. Keyword extraction
        keyword = cleanQueryWithRules(query);

        return new ParsedQuery(categoryId, maxPrice, minPrice, keyword);
    }

    private Long findCategoryIdByName(String name) {
        List<CategoryDTO> list = getCategories();
        for (CategoryDTO cat : list) {
            if (cat.getName().equals(name)) {
                return cat.getId();
            }
        }
        return null;
    }

    private String cleanQueryWithRules(String query) {
        String cleanKeyword = query;
        cleanKeyword = cleanKeyword.replaceAll("\\d+(\\.\\d+)?\\s*만원", "");
        cleanKeyword = cleanKeyword.replaceAll("\\d+\\s*원", "");
        cleanKeyword = cleanKeyword.replaceAll("만원", "");
        cleanKeyword = cleanKeyword.replaceAll("이하|미만|이내|아래|이상|초과|대|추천|보여줘|찾아줘|있어|있니|해줘|의|상품|제품|물건|아이템|품목", "");
        cleanKeyword = cleanKeyword.replaceAll("\\s+", " ").trim();
        return cleanKeyword.isEmpty() ? null : cleanKeyword;
    }

    private int calculateRelevanceScore(ProductDTO product, String keyword, Map<Long, String> categoryMap) {
        if (keyword == null || keyword.isEmpty()) {
            return 1;
        }

        int score = 0;
        String name = product.getName() != null ? product.getName() : "";
        String desc = product.getDescription() != null ? product.getDescription() : "";
        String catName = categoryMap.getOrDefault((long) product.getCategoryId(), "");

        if (name.contains(keyword)) {
            score += 10;
            if (name.startsWith(keyword)) {
                score += 5;
            }
        }
        if (desc.contains(keyword)) {
            score += 5;
        }
        if (catName.contains(keyword)) {
            score += 15;
        }

        return score;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class ParsedQuery {
        private Long categoryId;
        private Integer maxPrice;
        private Integer minPrice;
        private String keyword;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class ScoredProduct {
        private ProductDTO product;
        private int score;
    }
}
