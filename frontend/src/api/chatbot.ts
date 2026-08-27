import { client } from "./client";
import type { ApiResponse } from "../types/api";

export type ChatbotReply = {
    answer: string;
    suggestions: string[];
};


export async function askChatbot(message: string) {
    const response = await client.post<ApiResponse<ChatbotReply>>(
        "/chatbot",
        { message },

    );

    return response.data.data;
    
}