package com.kopang.app.domain.membership;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.kopang.app.domain.user.UserMapper;
import com.kopang.app.domain.user.UserDTO;
import com.kopang.app.domain.churn.ChurnMapper;
import com.kopang.app.domain.churn.ChurnScoreDTO;
import com.kopang.app.domain.intervention.InterventionService;
import com.kopang.app.domain.intervention.InterventionRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/membership")
public class MembershipController {

    private final MembershipService membershipService;
    private final UserMapper userMapper;
    private final ChurnMapper churnMapper;
    private final InterventionService interventionService;

    public MembershipController(MembershipService membershipService, UserMapper userMapper, ChurnMapper churnMapper,
            InterventionService interventionService) {
        this.membershipService = membershipService;
        this.userMapper = userMapper;
        this.churnMapper = churnMapper;
        this.interventionService = interventionService;
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

    // 6. 멤버십 이탈 방지 모달 노출 기록 (POST /api/membership/interventions/modal)
    @PostMapping("/interventions/modal")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recordModalIntervention(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            UserDTO user = userMapper.detailByEmail(userDetails.getEmail());
            if (user == null) {
                return ResponseEntity.badRequest().body(ApiResponse.fail("사용자를 찾을 수 없습니다."));
            }

            ChurnScoreDTO latestScore = churnMapper.findLatestScoreByUserIdAndRiskType(user.getUserId(),
                    "MEMBERSHIP_CANCEL");
            Long churnScoreId = latestScore != null ? latestScore.getChurnScoreId() : null;

            int recentCount = churnMapper.countRecentIntervention(user.getUserId(), "MEMBERSHIP_CANCEL", "MODAL", 7);

            // 대조군 판정은 recordAndCheckControl 의 결과를 그대로 쓴다.
            // 여기서 userId % 5 로 따로 계산하면 실제 기록(유형별 해시 배정)과 어긋나
            // 프론트가 받은 isControl 과 DB의 is_control 이 달라진다.
            boolean isControl;
            if (recentCount == 0) {
                InterventionRequest req = new InterventionRequest(
                        user.getUserId(),
                        churnScoreId,
                        "MEMBERSHIP_CANCEL",
                        "MODAL",
                        "IN_APP");
                isControl = interventionService.recordAndCheckControl(List.of(req)).control() > 0;
            } else {
                // 이미 기록된 건이 있으면 그 기록의 판정을 따른다
                isControl = churnMapper.isControlRecorded(user.getUserId(), "MEMBERSHIP_CANCEL", "MODAL");
            }

            Map<String, Object> data = new HashMap<>();
            data.put("isControl", isControl);
            data.put("message", recentCount > 0 ? "최근 7일 내 이미 모달 노출이 기록되었습니다." : "이탈방지 모달 노출이 기록되었습니다.");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
