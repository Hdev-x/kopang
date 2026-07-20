package com.kopang.app.domain.support.chatbot;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class ChatbotResponseDTO {
    private String answer;
    private List<String> suggestions;

    
}
