package com.kopang.app.domain.category;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryMapper categoryMapper;

    public List<CategoryDTO> getCategoryTree() {
        List<CategoryDTO> allCategories = categoryMapper.findAll();
        List<CategoryDTO> rootCategories = new ArrayList<>();
        Map<Long, CategoryDTO> categoryMap = new HashMap<>();

        // 1. Map에 모든 카테고리를 ID 기반으로 저장하고 children 리스트 초기화
        for (CategoryDTO category : allCategories) {
            category.setChildren(new ArrayList<>());
            categoryMap.put(category.getId(), category);
        }

        // 2. 부모-자식 관계 설정
        for (CategoryDTO category : allCategories) {
            Long parentId = category.getParentId();
            if (parentId == null) {
                // 부모가 없으면 루트 카테고리
                rootCategories.add(category);
            } else {
                // 부모가 있으면 부모의 children 리스트에 추가
                CategoryDTO parent = categoryMap.get(parentId);
                if (parent != null) {
                    parent.getChildren().add(category);
                }
            }
        }

        return rootCategories;
    }
}
