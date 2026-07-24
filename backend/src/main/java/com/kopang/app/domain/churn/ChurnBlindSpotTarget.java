package com.kopang.app.domain.churn;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChurnBlindSpotTarget {

    private Long userId;
    private Long churnScoreId;
    private Double score;
}
