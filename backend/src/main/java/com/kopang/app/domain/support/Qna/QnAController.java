package com.kopang.app.domain.support.Qna;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.kopang.app.domain.user.UserService;
import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;

import java.util.List;

@RestController
@RequestMapping({ "/api/qna", "/api/inquiries" })
@RequiredArgsConstructor

public class QnAController {

    private final QnAService qnAService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<QnADTO>>> getQnaList(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String type) {

        if (userDetails == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.fail("UNAUTHORIZED"));
        }

        Long userId = userService
                .detailByEmail(userDetails.getEmail())
                .getUserId();

        List<QnADTO> qnaList = qnAService.getQnaList(userId, type);

        return ResponseEntity.ok(ApiResponse.success(qnaList));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<QnADTO>>> getProductQnaList(
            @PathVariable("productId") Long productId) {

        List<QnADTO> qnaList = qnAService.getProductQnaList(productId);

        return ResponseEntity.ok(ApiResponse.success(qnaList));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QnADTO>> getQna(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long id) {

        if (userDetails == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.fail("UNAUTHORIZED"));
        }

        try {
            Long userId = userService
                    .detailByEmail(userDetails.getEmail())
                    .getUserId();

            QnADTO qna = qnAService.getQna(userId, id);

            return ResponseEntity.ok(ApiResponse.success(qna));
        } catch (IllegalArgumentException e) {
            if ("NOT_FOUND".equals(e.getMessage())) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.fail("NOT_FOUND"));
            }

            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QnADTO>> createQna(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody QnADTO qna) {

        if (userDetails == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.fail("UNAUTHORIZED"));
        }

        try {
            Long userId = userService
                    .detailByEmail(userDetails.getEmail())
                    .getUserId();

            QnADTO createdQna = qnAService.createQna(userId, qna);

            return ResponseEntity.ok(ApiResponse.success(createdQna));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<ApiResponse<Void>> answerQna(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") Long id,
            @RequestBody QnADTO qna) {

        if (userDetails == null || !"ADMIN".equals(userDetails.getRole())) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.fail("관리자 권한이 없습니다."));
        }

        try {
            qnAService.answerQna(id, qna.getAnswerContent());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            if ("NOT_FOUND".equals(e.getMessage())) {
                return ResponseEntity.status(404)
                        .body(ApiResponse.fail("NOT_FOUND"));
            }

            if ("VALIDATION_ERROR".equals(e.getMessage())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.fail("VALIDATION_ERROR"));
            }

            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(e.getMessage()));
        }
    }
}
