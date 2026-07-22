package com.kopang.app.domain.support.Faq;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/faqs")
@RequiredArgsConstructor
public class AdminFaqController {

    private final FaqService faqService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createFaq(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody FaqRequestDTO request) {

        if (userDetails == null || !"ADMIN".equals(userDetails.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.fail("관리자 권한이 없습니다."));
        }

        try {
            faqService.createFaq(request);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail(e.getMessage()));
        }
    }

@PutMapping("/{id}")
public ResponseEntity<ApiResponse<Void>> updateFaq(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable("id") Long id,
        @RequestBody FaqRequestDTO request) {

    if (userDetails == null || !"ADMIN".equals(userDetails.getRole())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.fail("관리자 권한이 없습니다."));
    }

    try {
        faqService.updateFaq(id, request);

        return ResponseEntity.ok(ApiResponse.success(null));
    } catch (IllegalArgumentException e) {
        if ("NOT_FOUND".equals(e.getMessage())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("NOT_FOUND"));
        }

        return ResponseEntity.badRequest()
                .body(ApiResponse.fail(e.getMessage()));
    }
}
@DeleteMapping("/{id}")
public ResponseEntity<ApiResponse<Void>> deleteFaq(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable("id") Long id) {

    if (userDetails == null || !"ADMIN".equals(userDetails.getRole())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.fail("관리자 권한이 없습니다."));
    }

    try {
        faqService.deleteFaq(id);

        return ResponseEntity.ok(ApiResponse.success(null));
    } catch (IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail("NOT_FOUND"));
    }
}

}