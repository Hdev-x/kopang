package com.kopang.app.domain.support.Qna;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import java.util.List;

@Service
@RequiredArgsConstructor

public class QnAService {
    private final QnAMapper qnAMapper;

    public List<QnADTO> getQnaList(String type) {
        if (type == null || type.isBlank()) {
            return qnAMapper.findAll();
        }

        return qnAMapper.findByType(type);
    }

    public QnADTO getQna(Long id) {
        QnADTO qna = qnAMapper.findById(id);
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
