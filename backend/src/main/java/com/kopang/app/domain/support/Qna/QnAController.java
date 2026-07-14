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
import com.kopang.app.global.common.ApiResponse;
import java.util.List;

@RestController
@RequestMapping({"/api/qna", "/api/inquiries"})
@RequiredArgsConstructor

public class QnAController {

    private final QnAService qnAService;
    private static final Long DEFAULT_USER_ID = 1L; // 임시 로그인 이후

    @GetMapping
    public ApiResponse<List<QnADTO>> getQnaList(@RequestParam(required = false) String type) {
        List<QnADTO> qnaList = qnAService.getQnaList(type);

        return ApiResponse.success(qnaList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QnADTO>> getQna(@PathVariable("id") Long id) {
        try {
            QnADTO qna = qnAService.getQna(id);
            return ResponseEntity.ok(ApiResponse.success(qna));
        } catch (IllegalArgumentException e) {
            if ("NOT_FOUND".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(ApiResponse.fail("NOT_FOUND"));
            }

            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));

        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QnADTO>> createQna(@RequestBody QnADTO qna) {
        try {
            QnADTO createdQna = qnAService.createQna(DEFAULT_USER_ID, qna);
            return ResponseEntity.ok(ApiResponse.success(createdQna));
        } catch (IllegalArgumentException e) {
            if ("VALIDATION_ERROR".equals(e.getMessage())) {
                return ResponseEntity.badRequest().body(ApiResponse.fail("VALIDATION_ERROR"));
            }

            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));

        }
    }

    @PostMapping("/{id}/answer")
    public ResponseEntity<ApiResponse<Void>> answerQna(@PathVariable("id") Long id, @RequestBody QnADTO qna) {
        try {
            qnAService.answerQna(id, qna.getAnswerContent());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            if ("NOT_FOUND".equals(e.getMessage())) {
                return ResponseEntity.status(404).body(ApiResponse.fail("NOT_FOUND"));

            }
            if ("VALIDATION_ERROR".equals(e.getMessage())) {
                return ResponseEntity.badRequest().body(ApiResponse.fail("VALIDATION_ERROR"));
            }

            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }

    }
}
