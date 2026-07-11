package com.kopang.app.domain.order;

import com.kopang.app.domain.user.UserService;
import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<Long>> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody OrderRequestDTO request) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        Long orderId = orderService.createOrder(userId, request);
        return ResponseEntity.ok(ApiResponse.success(orderId));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderDTO>>> getOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        List<OrderDTO> orders = orderService.getOrders(userId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderDTO>> getOrderDetails(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long orderId) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        
        OrderDTO order = orderService.getOrderDetails(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문 내역이 존재하지 않습니다. ID: " + orderId);
        }
        
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        if (!order.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("해당 주문에 대한 접근 권한이 없습니다."));
        }
        
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ConfirmRequestDTO request) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        orderService.confirmOrder(userId, request.getPaymentKey(), request.getOrderId(), request.getAmount());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long orderId) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        
        OrderDTO order = orderService.getOrderDetails(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문건이 존재하지 않습니다. ID: " + orderId);
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        if (!order.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("해당 주문을 취소할 권한이 없습니다."));
        }
        
        orderService.cancelOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long orderId) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        
        OrderDTO order = orderService.getOrderDetails(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문건이 존재하지 않습니다. ID: " + orderId);
        }
        Long userId = userService.detailByEmail(userDetails.getEmail()).getUserId();
        if (!order.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("해당 주문을 삭제할 권한이 없습니다."));
        }
        
        orderService.deleteOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
