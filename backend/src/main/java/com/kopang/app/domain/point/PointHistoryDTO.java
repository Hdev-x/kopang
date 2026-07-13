package com.kopang.app.domain.point;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointHistoryDTO {
    private Long pointId;
    private Long userId;
    private int amount; // 변동 포인트 (적립은 +, 사용은 -)
    private String type; // SAVED / USED / EVENT / REVIEW
    private String description;
    private Date createdAt;
}
