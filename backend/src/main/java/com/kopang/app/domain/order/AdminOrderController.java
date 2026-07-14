package com.kopang.app.domain.order;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDTO>>> getAdminOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(value = "ship", required = false) String ship) {
        
        if (userDetails == null || !"ADMIN".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("관리자 권한이 없습니다."));
        }

        List<OrderDTO> orders = orderService.getAllOrders(ship);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PatchMapping("/{id}/ship")
    public ResponseEntity<ApiResponse<Void>> updateOrderShipStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long orderId,
            @RequestBody Map<String, String> body) {
        
        if (userDetails == null || !"ADMIN".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("관리자 권한이 없습니다."));
        }

        String status = body.get("status");
        if (status == null || status.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("배송 상태값이 유효하지 않습니다."));
        }

        try {
            orderService.updateOrderStatus(orderId, status);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
