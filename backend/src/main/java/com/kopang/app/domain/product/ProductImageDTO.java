package com.kopang.app.domain.product;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductImageDTO {

    private int imageId;
    private int productId;
    private String url;
    
}
