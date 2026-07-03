package com.kopang.app.domain.product;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.common.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final S3Service s3Service;

    @GetMapping
    public ApiResponse<PageResponse<ProductResponseDTO>> getProducts(
            @RequestParam(value = "category", required = false) Long categoryId,
            @RequestParam(value = "cat", required = false) Long catId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "sort", defaultValue = "popular") String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Long targetCategoryId = catId != null ? catId : categoryId;
        PageResponse<ProductResponseDTO> products = productService.getProducts(targetCategoryId, keyword, sort, page, size);
        return ApiResponse.success(products);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponseDTO> getProduct(@PathVariable("id") Long id) {
        return ApiResponse.success(productService.getProduct(id));
    }

    @PostMapping
    public ApiResponse<Long> createProduct(@RequestBody ProductDTO dto) {
        Long productId = productService.createProduct(dto);
        return ApiResponse.success(productId);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> updateProduct(@PathVariable("id") Long id, @RequestBody ProductDTO dto) {
        productService.updateProduct(id, dto);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/images")
    public ApiResponse<String> uploadProductImage(@RequestParam("file") MultipartFile file) {
        String imageUrl = s3Service.uploadFile(file);
        return ApiResponse.success(imageUrl);
    }
}
