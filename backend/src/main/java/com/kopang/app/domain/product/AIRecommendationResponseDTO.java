package com.kopang.app.domain.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AIRecommendationResponseDTO {
    private List<ProductResponseDTO> similarProducts;
    private List<ProductResponseDTO> frequentlyBoughtTogether;
}
