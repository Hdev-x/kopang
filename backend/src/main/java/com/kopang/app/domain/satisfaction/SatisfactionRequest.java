package com.kopang.app.domain.satisfaction;

import lombok.Data;

/** 만족도 제출 요청 (POST /api/satisfaction) */
@Data
public class SatisfactionRequest {
    private Integer score;   // 1~5
    private String context;  // ORDER(주문완료) / CANCEL(해지) / CS
    private String reason;   // 사유(선택): DELIVERY/QUALITY/PRICE/SERVICE/ETC — 2026-07-24 회의 결정
}
