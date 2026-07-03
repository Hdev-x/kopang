package com.kopang.app.domain.product;

import com.kopang.app.global.common.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductMapper productMapper;

    public PageResponse<ProductResponseDTO> getProducts(Long categoryId, String keyword, int page, int size) {
        int offset = page * size;
        List<ProductDTO> products = productMapper.findProducts(categoryId, keyword, size, offset);
        long totalCount = productMapper.countProducts(categoryId, keyword);

        List<ProductResponseDTO> content = products.stream()
                .map(ProductResponseDTO::from)
                .collect(Collectors.toList());

        return PageResponse.of(content, page, size, totalCount);
    }

    public ProductResponseDTO getProduct(Long id) {
        ProductDTO dto = productMapper.findById(id);
        if (dto == null) {
            throw new IllegalArgumentException("존재하지 않는 상품입니다. ID: " + id);
        }
        return ProductResponseDTO.from(dto);
    }
}
