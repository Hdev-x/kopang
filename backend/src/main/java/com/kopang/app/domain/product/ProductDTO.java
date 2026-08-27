package com.kopang.app.domain.product;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductDTO {

    private int productId;
    private int categoryId;
    private String name;
    private String description;
    private int price;
    private int discountPrice;
    private int stock;
    private String imageUrl;
    private String status;
    private LocalDateTime createdAt;
    private List<String> imageUrls;
}
