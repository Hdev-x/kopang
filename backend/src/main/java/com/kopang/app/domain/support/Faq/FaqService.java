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

    public void createFaq(FaqRequestDTO request) {
        validateRequest(request);
        faqMapper.insert(request);
    }

    public void updateFaq(Long id, FaqRequestDTO request) {
        validateRequest(request);

        int updatedRows = faqMapper.update(id, request);

        if (updatedRows == 0) {
            throw new IllegalArgumentException("NOT_FOUND");
        }
    }

    public void deleteFaq(Long id) {
        int deletedRows = faqMapper.deleteById(id);

        if (deletedRows == 0) {
            throw new IllegalArgumentException("NOT_FOUND");
        }
    }

    private void validateRequest(FaqRequestDTO request) {
        if (request == null
                || request.getQuestion() == null
                || request.getQuestion().isBlank()
                || request.getAnswer() == null
                || request.getAnswer().isBlank()
                || request.getCategory() == null
                || request.getCategory().isBlank()) {
            throw new IllegalArgumentException("VALIDATION_ERROR");
        }
    }
}