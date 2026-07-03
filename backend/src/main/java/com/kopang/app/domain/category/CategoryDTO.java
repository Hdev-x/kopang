package com.kopang.app.domain.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDTO {
    private Long id;
    private Long parentId;
    private Integer depth;
    private String name;
    
    @Builder.Default
    private List<CategoryDTO> children = new ArrayList<>();
}
