package com.kopang.app.domain.admin;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // 1. 회원 목록 조회 (GET /api/admin/members)
    @GetMapping("/members")
    public ResponseEntity<ApiResponse<List<AdminMemberDTO>>> getMembers(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            List<AdminMemberDTO> list = adminService.getMemberList();
            return ResponseEntity.ok(ApiResponse.success(list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 2. 멤버십 통계 정보 및 해지 위험군 목록 조회 (GET /api/admin/membership/stats)
    @GetMapping("/membership/stats")
    public ResponseEntity<ApiResponse<AdminMembershipStatsDTO>> getMembershipStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            AdminMembershipStatsDTO stats = adminService.getMembershipStats();
            return ResponseEntity.ok(ApiResponse.success(stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 3. 쿠폰 실적 통계 조회 (GET /api/admin/coupons)
    @GetMapping("/coupons")
    public ResponseEntity<ApiResponse<List<AdminCouponStatsDTO>>> getCoupons(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            List<AdminCouponStatsDTO> list = adminService.getCouponStats();
            return ResponseEntity.ok(ApiResponse.success(list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 4. 신규 쿠폰 발행 (이벤트 등록) (POST /api/admin/coupons/create)
    @PostMapping("/coupons/create")
    public ResponseEntity<ApiResponse<Map<String, String>>> createCoupon(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody com.kopang.app.domain.coupon.CouponDTO coupon) {
        try {
            adminService.createCoupon(coupon);
            Map<String, String> res = new HashMap<>();
            res.put("message", "신규 쿠폰이 성공적으로 발행되었습니다");
            return ResponseEntity.ok(ApiResponse.success(res));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
