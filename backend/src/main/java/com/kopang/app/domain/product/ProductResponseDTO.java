package com.kopang.app.domain.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDTO {
    private Long id;
    private String name;
    private Integer price;
    private String imageUrl;
    private String brand;
    private Integer discountRate;
    private String description;
    private Integer stock;
    private Long categoryId;

    public static ProductResponseDTO from(ProductDTO dto) {
        int rate = 0;
        if (dto.getPrice() > 0 && dto.getDiscountPrice() > 0 && dto.getPrice() > dto.getDiscountPrice()) {
            rate = (int) Math.round(((double)(dto.getPrice() - dto.getDiscountPrice()) / dto.getPrice()) * 100);
        }
        return ProductResponseDTO.builder()
                .id((long) dto.getProductId())
                .name(dto.getName())
                .price(dto.getPrice())
                .imageUrl(dto.getImageUrl())
                .brand(null) // DB에 브랜드가 없으므로 null로 반환하거나 생략
                .discountRate(rate)
                .description(dto.getDescription())
                .stock(dto.getStock())
                .categoryId((long) dto.getCategoryId())
                .build();
    }
}
