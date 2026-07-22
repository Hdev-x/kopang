package com.kopang.app.domain.support.Faq;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class FaqDTO {
    private Long id;
    private String question;
    private String answer;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


}
