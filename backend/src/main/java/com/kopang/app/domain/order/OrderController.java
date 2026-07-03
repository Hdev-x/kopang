package com.kopang.app.domain.order;

import com.kopang.app.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private static final Long DEFAULT_USER_ID = 1L; // 임시 홍길동 계정

    @PostMapping
    public ApiResponse<Long> createOrder(@RequestBody OrderRequestDTO request) {
        Long orderId = orderService.createOrder(DEFAULT_USER_ID, request);
        return ApiResponse.success(orderId);
    }

    @GetMapping
    public ApiResponse<List<OrderDTO>> getOrders() {
        List<OrderDTO> orders = orderService.getOrders(DEFAULT_USER_ID);
        return ApiResponse.success(orders);
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDTO> getOrderDetails(@PathVariable("id") Long orderId) {
        OrderDTO order = orderService.getOrderDetails(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문 내역이 존재하지 않습니다. ID: " + orderId);
        }
        return ApiResponse.success(order);
    }

    @PostMapping("/confirm")
    public ApiResponse<Void> confirmOrder(@RequestBody ConfirmRequestDTO request) {
        orderService.confirmOrder(DEFAULT_USER_ID, request.getPaymentKey(), request.getOrderId(), request.getAmount());
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancelOrder(@PathVariable("id") Long orderId) {
        orderService.cancelOrder(orderId);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteOrder(@PathVariable("id") Long orderId) {
        orderService.deleteOrder(orderId);
        return ApiResponse.success(null);
    }
}
