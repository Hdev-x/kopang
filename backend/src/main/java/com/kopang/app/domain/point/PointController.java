package com.kopang.app.domain.point;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/points")
public class PointController {

    private final PointService pointService;

    public PointController(PointService pointService) {
        this.pointService = pointService;
    }

    // 1. 현재 포인트 잔액 조회 (GET /api/points/balance)
    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getBalance(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            int balance = pointService.getBalance(userDetails.getEmail());
            Map<String, Integer> data = new HashMap<>();
            data.put("balance", balance);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 2. 포인트 적립/사용 내역 조회 (GET /api/points/history)
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PointHistoryDTO>>> getHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            List<PointHistoryDTO> history = pointService.getHistory(userDetails.getEmail());
            return ResponseEntity.ok(ApiResponse.success(history));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 3. 포인트 모의 적립 (테스트용) (POST /api/points/earn)
    @PostMapping("/earn")
    public ResponseEntity<ApiResponse<Map<String, String>>> earnPoints(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            int amount = Integer.parseInt(body.get("amount").toString());
            String type = body.getOrDefault("type", "EVENT").toString();
            String description = body.getOrDefault("description", "이벤트 참여 적립").toString();

            pointService.earnPoints(userDetails.getEmail(), amount, type, description);
            
            Map<String, String> data = new HashMap<>();
            data.put("message", amount + "P가 성공적으로 적립되었습니다");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 4. 포인트 모의 사용 (테스트용) (POST /api/points/use)
    @PostMapping("/use")
    public ResponseEntity<ApiResponse<Map<String, String>>> usePoints(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            int amount = Integer.parseInt(body.get("amount").toString());
            String description = body.getOrDefault("description", "상품 구매 사용").toString();

            pointService.usePoints(userDetails.getEmail(), amount, description);

            Map<String, String> data = new HashMap<>();
            data.put("message", amount + "P가 차감 사용되었습니다");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
