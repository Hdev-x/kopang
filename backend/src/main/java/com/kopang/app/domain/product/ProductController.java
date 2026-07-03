package com.kopang.app.domain.product;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.common.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductResponseDTO>> getProducts(
            @RequestParam(value = "category", required = false) Long categoryId,
            @RequestParam(value = "cat", required = false) Long catId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Long targetCategoryId = catId != null ? catId : categoryId;
        PageResponse<ProductResponseDTO> products = productService.getProducts(targetCategoryId, keyword, page, size);
        return ApiResponse.success(products);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponseDTO> getProduct(@PathVariable("id") Long id) {
        return ApiResponse.success(productService.getProduct(id));
    }
}
