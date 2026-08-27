package com.kopang.app.domain.support.Qna;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import org.springframework.http.ResponseEntity;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;

import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/inquiries")
@RequiredArgsConstructor
public class AdminQnAController {

    private final QnAService qnAService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<QnADTO>>> getAllQna(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails == null || !"ADMIN".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("관리자 권한이 없습니다."));
        }

        List<QnADTO> qnaList = qnAService.getAllQnaForAdmin();

        return ResponseEntity.ok(ApiResponse.success(qnaList));

    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QnADTO>> getQna(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long id) {

        if (userDetails == null || !"ADMIN".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("관리자 권한이 없습니다."));
        }

        try {
            QnADTO qna = qnAService.getQnaForAdmin(id);

            return ResponseEntity.ok(ApiResponse.success(qna));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("NOT_FOUND"));
        }
    }
}
