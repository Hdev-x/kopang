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
    private final S3Service s3Service;
    private final AISimilarProductService aiSimilarProductService;

    public PageResponse<ProductResponseDTO> getProducts(Long categoryId, String keyword, String sort, int page, int size) {
        int offset = page * size;
        List<ProductDTO> products = productMapper.findProducts(categoryId, keyword, sort, size, offset);
        long totalCount = productMapper.countProducts(categoryId, keyword);

        List<ProductResponseDTO> content = products.stream()
                .map(ProductResponseDTO::from)
                .collect(Collectors.toList());

        // 백그라운드 AI 추천 예열 (상위 5개 상품)
        List<Long> topIds = products.stream()
                .limit(5)
                .map(p -> (long) p.getProductId())
                .collect(Collectors.toList());
        aiSimilarProductService.warmupRecommendationsAsync(topIds);

        return new PageResponse<>(content, page, size, totalCount);
    }

    public ProductResponseDTO getProduct(Long id) {
        ProductDTO dto = productMapper.findById(id);
        if (dto == null) {
            throw new IllegalArgumentException("존재하지 않는 상품입니다. ID: " + id);
        }
        dto.setImageUrls(productMapper.findImageUrlsByProductId(id.intValue()));
        return ProductResponseDTO.from(dto);
    }

    @org.springframework.transaction.annotation.Transactional
    public Long createProduct(ProductDTO dto) {
        productMapper.insertProduct(dto);
        int productId = dto.getProductId();
        
        // 상세 이미지 리스트 저장
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            for (String url : dto.getImageUrls()) {
                productMapper.insertProductImage(productId, url);
            }
        }
        return (long) productId;
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateProduct(Long id, ProductDTO dto) {
        ProductDTO existing = productMapper.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("존재하지 않는 상품입니다. ID: " + id);
        }
        
        // S3 동기화 삭제를 위해 기존 상세 이미지 리스트 조회
        List<String> oldImageUrls = productMapper.findImageUrlsByProductId(id.intValue());

        dto.setProductId(id.intValue());
        productMapper.updateProduct(dto);

        // 상세 이미지 리스트 갱신 (전체 삭제 후 재등록)
        productMapper.deleteProductImagesByProductId(id.intValue());
        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            for (String url : dto.getImageUrls()) {
                productMapper.insertProductImage(id.intValue(), url);
            }
        }

        // 폼에서 제외(삭제)된 이미지는 S3에서 물리 삭제 실행
        if (oldImageUrls != null) {
            for (String oldUrl : oldImageUrls) {
                // 새 상세 이미지 목록에 포함되어 있지 않고, 새로운 대표 이미지로도 사용되지 않는 경우 삭제 대상
                boolean notInNewDetails = dto.getImageUrls() == null || !dto.getImageUrls().contains(oldUrl);
                boolean notNewMain = dto.getImageUrl() == null || !dto.getImageUrl().equals(oldUrl);
                
                if (notInNewDetails && notNewMain) {
                    s3Service.deleteFile(oldUrl);
                }
            }
        }

        // 기존 대표 이미지가 변경되었고, 새 상세 이미지 목록 및 새 대표 이미지 목록 어디에도 쓰이지 않는다면 S3 삭제
        String oldMainUrl = existing.getImageUrl();
        if (oldMainUrl != null && !oldMainUrl.equals(dto.getImageUrl())) {
            boolean notInNewDetails = dto.getImageUrls() == null || !dto.getImageUrls().contains(oldMainUrl);
            if (notInNewDetails) {
                s3Service.deleteFile(oldMainUrl);
            }
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteProduct(Long id) {
        ProductDTO existing = productMapper.findById(id);
        if (existing == null) {
            throw new IllegalArgumentException("존재하지 않는 상품입니다. ID: " + id);
        }

        // 삭제 전 S3 파일들을 수집
        String mainImageUrl = existing.getImageUrl();
        List<String> detailImageUrls = productMapper.findImageUrlsByProductId(id.intValue());

        try {
            // 상품 상세 이미지 삭제 먼저 실행 (외래키 무결성 방지)
            productMapper.deleteProductImagesByProductId(id.intValue());
            productMapper.deleteProduct(id);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new IllegalStateException("해당 상품은 주문 내역에 포함되어 있어 삭제할 수 없습니다. 먼저 관련 주문 내역을 처리해 주세요.");
        }

        // DB 쿼리가 온전히 에러 없이 성공했을 때만, S3에서 파일을 실제 삭제시킴
        s3Service.deleteFile(mainImageUrl);
        if (detailImageUrls != null) {
            for (String url : detailImageUrls) {
                s3Service.deleteFile(url);
            }
        }
    }

    public List<ProductResponseDTO> getSimilarProducts(Long id) {
        ProductDTO product = productMapper.findById(id);
        if (product == null) {
            return java.util.Collections.emptyList();
        }
        Long categoryId = (long) product.getCategoryId();
        int price = product.getPrice();
        List<ProductDTO> sim = productMapper.findSimilarProducts(id, categoryId, price, 6);
        return sim.stream().map(ProductResponseDTO::from).collect(Collectors.toList());
    }
}
