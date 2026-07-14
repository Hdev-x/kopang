package com.kopang.app.domain.search;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SearchHistoryDTO {
    private Long searchId;
    private Long userId;
    private String keyword;
    private LocalDateTime searchedAt;
}
