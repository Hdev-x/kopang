package com.kopang.app.domain.churn;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ChurnBlindSpotController {

    private final ChurnBlindSpotService churnBlindSpotService;

    @PostMapping("/api/admin/churn/ml-blindspot")
    public ResponseEntity<ApiResponse<ChurnBlindSpotResult>> run(
            @RequestParam(name = "limit") int limit) {
        return ResponseEntity.ok(
                ApiResponse.success(churnBlindSpotService.run(limit)));
    }
}
