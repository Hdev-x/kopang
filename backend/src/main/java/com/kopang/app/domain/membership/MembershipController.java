package com.kopang.app.domain.membership;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/membership")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    // 1. 멤버십 구독 상태 조회 (GET /api/membership/status)
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<UserMembershipDTO>> getStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            UserMembershipDTO membership = membershipService.getActiveMembership(userDetails.getEmail());
            return ResponseEntity.ok(ApiResponse.success(membership));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 2. 멤버십 가입 신청 (POST /api/membership/subscribe)
    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<UserMembershipDTO>> subscribe(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody java.util.Map<String, Object> body) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            String paymentKey = (String) body.get("paymentKey");
            String orderId = (String) body.get("orderId");
            int amount = Integer.parseInt(String.valueOf(body.get("amount")));

            UserMembershipDTO membership = membershipService.subscribe(
                    userDetails.getEmail(), paymentKey, orderId, amount);
            return ResponseEntity.ok(ApiResponse.success(membership));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 3. 멤버십 해지 예약 신청 (POST /api/membership/cancel)
    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Map<String, String>>> cancel(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            membershipService.cancel(userDetails.getEmail());
            Map<String, String> data = new HashMap<>();
            data.put("message", "멤버십 해지 예약이 정상 처리되었습니다");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 4. 멤버십 해지 예약 철회 및 유지 (POST /api/membership/keep)
    @PostMapping("/keep")
    public ResponseEntity<ApiResponse<Map<String, String>>> keep(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            membershipService.keep(userDetails.getEmail());
            Map<String, String> data = new HashMap<>();
            data.put("message", "멤버십 혜택 유지가 정상 적용되었습니다");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 5. 이번 달 아낀 배송비 조회 (GET /api/membership/saved-shipping)
    @GetMapping("/saved-shipping")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getSavedShipping(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            int savedFee = membershipService.getSavedShippingFee(userDetails.getEmail());
            Map<String, Integer> data = new HashMap<>();
            data.put("savedFee", savedFee);
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
