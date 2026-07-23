package com.kopang.app.domain.churn;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ChurnReportController {

    private final ChurnReportService churnReportService;

    // 대응 효과 리포트 (CHURN-08/10). from/to=기간 필터(옵션). /api/admin/** 는 ADMIN만 통과.
    @GetMapping("/api/admin/churn/report")
    public ResponseEntity<ApiResponse<ChurnReportResponse>> report(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(churnReportService.getReport(from, to)));
    }
}
