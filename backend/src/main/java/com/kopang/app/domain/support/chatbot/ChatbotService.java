package com.kopang.app.domain.support.chatbot;

import java.util.List;

import java.util.ArrayList;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Value;

@Service
public class ChatbotService {

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatbotResponseDTO reply(String message) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("VALIDATION_ERROR");
        }

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return new ChatbotResponseDTO(
                    "현재 AI 연결 설정이 필요합니다. 잠시 후 다시 이용해 주세요.",
                    List.of("1:1 문의하기"));
        }

        return requestAi(message);
    }

    private ChatbotResponseDTO requestAi(String message) {
        try {
            String prompt = """
                    당신은 온라인 쇼핑몰 코팡의 고객 상담 챗봇입니다.
                    항상 친절한 존댓말로 짧고 정확하게 답변하세요.
                    배송, 반품, 교환, 상품, 회원, 포인트, 쿠폰 문의를 안내하세요.
                    확인할 수 없는 주문 상태나 정책은 지어내지 말고
                    주문내역 또는 1:1 문의 이용을 안내하세요.
                    카드번호와 비밀번호 같은 개인정보를 요구하지 마세요.

                    반드시 아래 JSON 형식으로만 답변하세요.
                    {
                      "answer": "고객에게 보여줄 답변",
                      "suggestions": ["다음에 물어볼 만한 질문 1개"]
                    }

                    사용자 질문:
                    """ + message;

            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + "gemini-3.1-flash-lite:generateContent?key=" + geminiApiKey;

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)))),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "maxOutputTokens", 2048,
                            "temperature", 0.4));

            String responseBody = restTemplate.postForObject(url, requestBody, String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            String rawJson = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText();

            rawJson = rawJson
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();

            JsonNode result = objectMapper.readTree(rawJson);
            String answer = result.path("answer").asText("").trim();

            if (answer.isBlank()) {
                throw new IllegalStateException("EMPTY_AI_ANSWER");
            }

            List<String> suggestions = new ArrayList<>();

            for (JsonNode node : result.path("suggestions")) {
                String suggestion = node.asText("").trim();

                if (!suggestion.isBlank() && suggestions.size() < 1) {
                    suggestions.add(suggestion);
                }
            }

            return new ChatbotResponseDTO(answer, suggestions);
        } catch (Exception e) {
            return new ChatbotResponseDTO(
                    "AI 상담 연결에 문제가 생겼습니다. 잠시 후 다시 이용해 주세요.",
                    List.of("1:1 문의하기"));
        }
    }
}
