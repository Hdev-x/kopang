package com.kopang.app.domain.order;

import com.kopang.app.domain.cart.CartMapper;
import com.kopang.app.domain.cart.CartItemDTO;
import com.kopang.app.domain.product.ProductMapper;
import com.kopang.app.domain.product.ProductDTO;
import com.kopang.app.domain.point.PointMapper;
import com.kopang.app.domain.point.PointHistoryDTO;
import com.kopang.app.domain.membership.MembershipMapper;
import com.kopang.app.domain.membership.UserMembershipDTO;
import com.kopang.app.domain.coupon.CouponMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderMapper orderMapper;
    private final ProductMapper productMapper;
    private final CartMapper cartMapper;
    private final PointMapper pointMapper;
    private final MembershipMapper membershipMapper;
    private final CouponMapper couponMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${toss.secret-key}")
    private String tossSecretKey;

    @Transactional
    public Long createOrder(Long userId, OrderRequestDTO request) {
        // 1. 임시 주문 생성 (PENDING 상태)
        OrderDTO order = new OrderDTO();
        order.setUserId(userId);
        order.setTotalPrice(request.getTotalPrice());
        order.setPaymentStatus("PENDING");
        order.setUsedPoint(request.getUsedPoint());
        order.setUserCouponId(request.getUserCouponId());
        orderMapper.insertOrder(order);

        Long orderId = order.getOrderId();

        // 2. 주문 상세 저장 (재고 차감 및 장바구니 비우기는 결제 승인 시점으로 위임)
        for (OrderRequestDTO.OrderItemRequest reqItem : request.getItems()) {
            OrderItemDTO orderItem = new OrderItemDTO();
            orderItem.setOrderId(orderId);
            orderItem.setProductId(reqItem.getProductId());
            orderItem.setQuantity(reqItem.getQuantity());
            orderItem.setPrice(reqItem.getPrice());
            orderMapper.insertOrderItem(orderItem);
        }

        return orderId;
    }

    @Transactional
    public void confirmOrder(Long userId, String paymentKey, String orderIdStr, int amount) {
        // 1. 주문 ID 파싱 (ORD-123 -> 123)
        Long orderId;
        try {
            orderId = Long.parseLong(orderIdStr.replace("ORD-", ""));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("유효하지 않은 주문 ID 형식입니다: " + orderIdStr);
        }

        // 2. DB 주문 조회 및 금액 무결성 검증
        OrderDTO order = orderMapper.findOrderById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문건이 존재하지 않습니다. ID: " + orderId);
        }
        if (order.getTotalPrice() != amount) {
            throw new IllegalArgumentException("결제 요청 금액과 주문 금액이 일치하지 않습니다. (금액 위변조 의심)");
        }
        if ("PAID".equals(order.getPaymentStatus())) {
            return; // 이미 결제 승인 완료된 주문인 경우 중복 적립 및 처리 방지
        }

        // 3. 토스페이먼츠 승인 API 통신
        String url = "https://api.tosspayments.com/v1/payments/confirm";
        HttpHeaders headers = new HttpHeaders();
        String auth = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + auth);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("paymentKey", paymentKey);
        body.put("orderId", orderIdStr);
        body.put("amount", amount);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() != HttpStatus.OK) {
                throw new IllegalArgumentException("토스 결제 승인에 실패했습니다.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("결제 승인 통신 오류: " + e.getMessage());
        }

        // 4. 결제 승인 성공 시 후처리 (결제 완료값으로 업데이트)
        orderMapper.updatePaymentStatus(orderId, "PAID");
        orderMapper.updateOrderStatus(orderId, "PAID");
        orderMapper.updatePaymentKey(orderId, paymentKey);

        // 사용한 쿠폰 처리
        if (order.getUserCouponId() != null && order.getUserCouponId() > 0) {
            couponMapper.useUserCoupon(order.getUserCouponId(), new java.util.Date());
        }

        // 사용한 포인트 차감 처리
        if (order.getUsedPoint() > 0) {
            PointHistoryDTO useHistory = new PointHistoryDTO();
            useHistory.setUserId(userId);
            useHistory.setAmount(-order.getUsedPoint());
            useHistory.setType("USED");
            useHistory.setDescription("주문 결제 포인트 사용 (주문 ID: " + orderId + ")");
            pointMapper.insertPointHistory(useHistory);
        }

        // 5. 상품 재고 감축
        List<OrderItemDTO> items = orderMapper.findOrderItemsByOrderId(orderId);
        for (OrderItemDTO item : items) {
            ProductDTO product = productMapper.findById(item.getProductId());
            if (product == null) {
                throw new IllegalArgumentException("존재하지 않는 상품입니다. ID: " + item.getProductId());
            }
            if (product.getStock() < item.getQuantity()) {
                throw new IllegalArgumentException("상품 [" + product.getName() + "]의 재고가 부족합니다.");
            }
            productMapper.updateStock(item.getProductId(), product.getStock() - item.getQuantity());
        }

        // 6. 장바구니 비우기
        Long cartId = cartMapper.findCartIdByUserId(userId);
        if (cartId != null) {
            List<CartItemDTO> cartItems = cartMapper.findCartItemsByCartId(cartId);
            for (CartItemDTO ci : cartItems) {
                cartMapper.deleteCartItem(ci.getItemId());
            }
        }
    }

    @Transactional
    public void cancelOrder(Long orderId) {
        OrderDTO order = orderMapper.findOrderById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문건이 존재하지 않습니다. ID: " + orderId);
        }
        if ("SHIPPING".equals(order.getOrderStatus()) || "DELIVERED".equals(order.getOrderStatus())) {
            throw new IllegalStateException("이미 배송 중이거나 완료된 주문은 취소할 수 없습니다.");
        }
        if ("CANCELLED".equals(order.getPaymentStatus())) {
            return;
        }

        // 1. 토스페이먼츠 환불 API 통신 (실결제 환불)
        if (order.getPaymentKey() != null && !order.getPaymentKey().isEmpty()) {
            String url = "https://api.tosspayments.com/v1/payments/" + order.getPaymentKey() + "/cancel";
            HttpHeaders headers = new HttpHeaders();
            String auth = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes(StandardCharsets.UTF_8));
            headers.set("Authorization", "Basic " + auth);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("cancelReason", "고객 단순 변심");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                if (response.getStatusCode() != HttpStatus.OK) {
                    throw new IllegalArgumentException("토스 결제 취소 승인에 실패했습니다.");
                }
            } catch (Exception e) {
                throw new IllegalArgumentException("결제 취소 통신 오류: " + e.getMessage());
            }
        }

        // 2. 상태값 변경
        orderMapper.updatePaymentStatus(orderId, "CANCELLED");
        orderMapper.updateOrderStatus(orderId, "CANCELLED");

        // 3. 재고 환원 (주문 취소로 인한 플러스)
        List<OrderItemDTO> items = orderMapper.findOrderItemsByOrderId(orderId);
        for (OrderItemDTO item : items) {
            ProductDTO product = productMapper.findById(item.getProductId());
            if (product != null) {
                productMapper.updateStock(item.getProductId(), product.getStock() + item.getQuantity());
            }
        }
    }

    public List<OrderDTO> getOrders(Long userId) {
        return orderMapper.findOrdersByUserId(userId);
    }

    public OrderDTO getOrderDetails(Long orderId) {
        OrderDTO order = orderMapper.findOrderById(orderId);
        if (order != null) {
            order.setItems(orderMapper.findOrderItemsByOrderId(orderId));
        }
        return order;
    }

    @Transactional
    public void deleteOrder(Long orderId) {
        OrderDTO order = orderMapper.findOrderById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문건이 존재하지 않습니다. ID: " + orderId);
        }
        if ("PAID".equals(order.getPaymentStatus())) {
            throw new IllegalStateException("결제 완료된 주문은 바로 삭제할 수 없습니다. 먼저 주문을 취소해 주세요.");
        }
        orderMapper.deleteOrderItems(orderId);
        orderMapper.deleteOrder(orderId);
    }

    public List<OrderDTO> getAllOrders(String ship) {
        return orderMapper.findAllOrders(ship);
    }

    @Transactional
    public void updateOrderStatus(Long orderId, String status) {
        OrderDTO order = orderMapper.findOrderById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문건이 존재하지 않습니다. ID: " + orderId);
        }
        orderMapper.updateOrderStatus(orderId, status);
    }

    @Transactional
    public void refundOrder(Long orderId) {
        OrderDTO order = orderMapper.findOrderById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문건이 존재하지 않습니다. ID: " + orderId);
        }
        if (!"DELIVERED".equals(order.getOrderStatus())) {
            throw new IllegalStateException("배송이 완료된 주문만 환불 신청이 가능합니다.");
        }
        orderMapper.updateOrderStatus(orderId, "RETURNED");
    }

    @Transactional
    public void confirmPurchase(Long orderId) {
        OrderDTO order = orderMapper.findOrderById(orderId);
        if (order == null) {
            throw new IllegalArgumentException("주문건이 존재하지 않습니다. ID: " + orderId);
        }
        if (!"DELIVERED".equals(order.getOrderStatus())) {
            throw new IllegalStateException("배송이 완료된 주문만 구매확정이 가능합니다.");
        }
        orderMapper.updateOrderStatus(orderId, "CONFIRMED");

        // 구매확정 완료 시 포인트 자동 적립 (일반 1% / 멤버십 5%)
        Long userId = order.getUserId();
        UserMembershipDTO activeMembership = membershipMapper.findActiveMembershipByUserId(userId);
        double rate = 0.01;
        int ratePercent = 1;
        if (activeMembership != null && "ACTIVE".equals(activeMembership.getStatus())) {
            rate = 0.05; // 멤버십 회원은 5% 적립
            ratePercent = 5;
        }

        int pointReward = (int) Math.floor(order.getTotalPrice() * rate);
        if (pointReward > 0) {
            PointHistoryDTO rewardHistory = new PointHistoryDTO();
            rewardHistory.setUserId(userId);
            rewardHistory.setAmount(pointReward);
            rewardHistory.setType("SAVED");
            rewardHistory.setDescription("구매확정 포인트 적립 (" + ratePercent + "% 적립, 주문 ID: " + orderId + ")");
            pointMapper.insertPointHistory(rewardHistory);
        }
    }
}
