package com.kopang.app.domain.cart;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CartMapper {
    // 1. 유저의 장바구니 ID 조회 (없으면 null)
    Long findCartIdByUserId(@Param("userId") Long userId);
    
    // 2. 장바구니 생성
    void insertCart(@Param("userId") Long userId);
    
    // 3. 유저 장바구니의 모든 아이템 조회
    List<CartItemDTO> findCartItemsByCartId(@Param("cartId") Long cartId);
    
    // 4. 장바구니에 해당 상품이 이미 존재하는지 조회
    CartItemDTO findCartItemByProduct(@Param("cartId") Long cartId, @Param("productId") Long productId);
    
    // 5. 장바구니 아이템 추가
    void insertCartItem(@Param("cartId") Long cartId, @Param("productId") Long productId, @Param("quantity") int quantity);
    
    // 6. 장바구니 아이템 수량 수정
    void updateCartItemQuantity(@Param("cartItemId") Long cartItemId, @Param("quantity") int quantity);
    
    // 7. 장바구니 단건 조회 (수량 변경 시 재고 확인용)
    CartItemDTO findCartItemById(@Param("cartItemId") Long cartItemId);
    
    // 8. 장바구니 아이템 삭제
    void deleteCartItem(@Param("cartItemId") Long cartItemId);

    // 9. 특정 카트 ID 및 상품 ID에 해당하는 장바구니 아이템 삭제
    void deleteCartItemByProduct(@Param("cartId") Long cartId, @Param("productId") Long productId);
}
