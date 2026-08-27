package com.kopang.app.domain.order;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface OrderMapper {
    // 1. 주문 생성
    void insertOrder(OrderDTO order);
    
    // 2. 주문 상세 품목 추가
    void insertOrderItem(OrderItemDTO item);
    
    // 3. 유저의 주문 목록 조회
    List<OrderDTO> findOrdersByUserId(@Param("userId") Long userId);

    // 3-1. 관리자용 전체 주문 목록 조회 (배송 필터 적용)
    List<OrderDTO> findAllOrders(@Param("ship") String ship);
    
    // 4. 주문 단건 조회
    OrderDTO findOrderById(@Param("orderId") Long orderId);
    
    // 5. 주문 상품 목록 조회 (조인 포함)
    List<OrderItemDTO> findOrderItemsByOrderId(@Param("orderId") Long orderId);

    void updatePaymentStatus(@Param("orderId") Long orderId, @Param("paymentStatus") String paymentStatus);
    void updateOrderStatus(@Param("orderId") Long orderId, @Param("orderStatus") String orderStatus);
    void updatePaymentKey(@Param("orderId") Long orderId, @Param("paymentKey") String paymentKey);

    // 6. 주문 삭제 (주문 상세 먼저 삭제 후 주문 헤더 삭제)
    void deleteOrderItems(@Param("orderId") Long orderId);
    void deleteOrder(@Param("orderId") Long orderId);
}
