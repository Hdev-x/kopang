package com.kopang.app.domain.recommendation;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/recommendations")
@RequiredArgsConstructor
public class RecommendationAdminController {

    private final RecommendationService recommendationService;

    @PostMapping("/attribute-conversions")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> attributeConversions() {
        int attributed = recommendationService.attributeConversions();
        return ResponseEntity.ok(ApiResponse.success(Map.of("attributed", attributed)));
    }
}
