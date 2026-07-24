package com.kopang.app.domain.churn;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ChurnMlController {

    private final ChurnMlService churnMlService;

    // ML 이탈 스코어링 수동 실행 (CHURN-02/06 ML). 기존 룰 배치 /run 과 별도.
    // 추후 스케줄러(CHURN-06) 편입 가능. /api/admin/** 는 ADMIN만 통과.
    @PostMapping("/api/admin/churn/ml-run")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> mlRun() {
        int saved = churnMlService.runMlScoring();
        return ResponseEntity.ok(ApiResponse.success(Map.of("saved", saved)));
    }
}
