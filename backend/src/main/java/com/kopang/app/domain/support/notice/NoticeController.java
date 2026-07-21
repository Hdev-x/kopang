package com.kopang.app.domain.support.notice;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ApiResponse<List<NoticeDTO>> getNoticeList() {
        return ApiResponse.success(noticeService.getNoticeList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoticeDTO>> getNotice(
            @PathVariable("id") Long id) {
        try {
            return ResponseEntity.ok(
                    ApiResponse.success(noticeService.getNotice(id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.fail("NOT_FOUND"));
        }
    }

}
