package com.kopang.app.domain.coupon;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    // 1. 다운로드 가능한 쿠폰 목록 조회 (GET /api/coupons/available)
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<CouponDTO>>> getAvailable() {
        try {
            List<CouponDTO> list = couponService.getAvailableCoupons();
            return ResponseEntity.ok(ApiResponse.success(list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 2. 내가 보유한 쿠폰 목록 조회 (GET /api/coupons/my)
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<UserCouponDTO>>> getMy(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            List<UserCouponDTO> list = couponService.getMyCoupons(userDetails.getEmail());
            return ResponseEntity.ok(ApiResponse.success(list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 3. 쿠폰 다운로드 (발급 신청) (POST /api/coupons/issue)
    @PostMapping("/issue")
    public ResponseEntity<ApiResponse<UserCouponDTO>> issue(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Long> body) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            Long couponId = body.get("couponId");
            UserCouponDTO userCoupon = couponService.issueCoupon(userDetails.getEmail(), couponId);
            return ResponseEntity.ok(ApiResponse.success(userCoupon));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 4. 쿠폰 사용 처리 (POST /api/coupons/use)
    @PostMapping("/use")
    public ResponseEntity<ApiResponse<Map<String, String>>> use(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Long> body) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            Long userCouponId = body.get("userCouponId");
            couponService.useCoupon(userCouponId, userDetails.getUserId());

            Map<String, String> data = new HashMap<>();
            data.put("message", "쿠폰 사용 처리가 완료되었습니다");
            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
