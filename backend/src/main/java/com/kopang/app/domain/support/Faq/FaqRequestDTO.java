package com.kopang.app.domain.support.Faq;

import lombok.Data;

@Data
public class FaqRequestDTO {


    private String question;
    private String answer;
    private String category;
}
