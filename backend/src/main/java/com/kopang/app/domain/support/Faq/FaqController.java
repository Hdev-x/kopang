package com.kopang.app.domain.support.Faq;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kopang.app.global.common.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/faqs")
@RequiredArgsConstructor
public class FaqController {
    private final FaqService faqService;

    @GetMapping
    public ApiResponse<List<FaqDTO>> getFaqList() {
        return ApiResponse.success(faqService.getFaqList());
    }
}
