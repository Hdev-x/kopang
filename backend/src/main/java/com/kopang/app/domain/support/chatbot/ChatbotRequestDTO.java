package com.kopang.app.domain.support.chatbot;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;



@Data
@AllArgsConstructor
public class ChatbotRequestDTO {
    private String message;
    private List<String> suggestions;

    
}




