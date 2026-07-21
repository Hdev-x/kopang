package com.kopang.app.domain.support.Faq;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FaqService {
    private final FaqMapper faqMapper;

    public List<FaqDTO> getFaqList() {
        return faqMapper.findAll();
    }
}
