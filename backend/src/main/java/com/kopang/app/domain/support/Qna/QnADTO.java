package com.kopang.app.domain.support.Qna;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class QnADTO {
    private Long id;
    private Long userId;

    private String title;
    private String content;
    private String author;
    private String status;

    private LocalDateTime createdAt;

    private String answerContent;
    private String answerAuthor;
    private String answerStatus;
    
    private LocalDateTime updatedAt;



}
