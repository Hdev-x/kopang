package com.kopang.app.domain.support.Qna;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import java.util.List;

@Service
@RequiredArgsConstructor

public class QnAService {
    private final QnAMapper qnAMapper;

    public List<QnADTO> getQnaList(Long userId, String type) {
        if (type == null || type.isBlank()) {
            return qnAMapper.findAll(userId);
        }

        return qnAMapper.findByType(userId, type);
    }

    public List<QnADTO> getAllQnaForAdmin() {
        return qnAMapper.findAllForAdmin();
    }

    public QnADTO getQnaForAdmin(Long id) {
        QnADTO qna = qnAMapper.findById(id);

        if (qna == null) {
            throw new IllegalArgumentException("NOT_FOUND");
        }

        return qna;
    }

    public List<QnADTO> getProductQnaList(Long productId) {
        return qnAMapper.findByProductId(productId);
    }

    public QnADTO getQna(Long userId, Long id) {
        QnADTO qna = qnAMapper.findByIdAndUserId(id, userId);

        if (qna == null) {
            throw new IllegalArgumentException("NOT_FOUND");
        }

        return qna;
    }

    public QnADTO createQna(Long userId, QnADTO qna) {
        if (qna.getTitle() == null || qna.getTitle().isBlank()
                || qna.getContent() == null || qna.getContent().isBlank()) {
            throw new IllegalArgumentException("VALIDATION_ERROR");
        }

        qna.setUserId(userId);

        if (qna.getType() == null || qna.getType().isBlank()) {
            qna.setType("GENERAL");

        }

        if ("PRODUCT".equals(qna.getType())) {
            if (qna.getProductId() == null) {
                throw new IllegalArgumentException("VALIDATION_ERROR");
            }
        } else if ("GENERAL".equals(qna.getType())) {
            qna.setProductId(null);
        } else {
            throw new IllegalArgumentException("VALIDATION_ERROR");
        }

        qna.setStatus("답변대기");
        qnAMapper.insertQna(qna);

        return qna;
    }

    public void answerQna(Long id, String answerContent) {
        if (answerContent == null || answerContent.isBlank()) {
            throw new IllegalArgumentException("VALIDATION_ERROR");
        }

        QnADTO qna = qnAMapper.findById(id);
        if (qna == null) {
            throw new IllegalArgumentException("NOT_FOUND");
        }

        qnAMapper.answerQna(id, answerContent);
    }

}
