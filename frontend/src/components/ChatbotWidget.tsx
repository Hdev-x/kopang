import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import styles from "./ChatbotWidget.module.css";
import { getChatbotReply, INITIAL_QUESTIONS } from "../api/chatbotRules";


type Msg = {
  role: "bot" | "user";
  text: string;
  suggestions?: string[];
};


export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "안녕하세요! 코팡 AI 상담봇이에요. 무엇을 도와드릴까요?" },
  ]);

  const [input, setInput] = useState("");

  const ask = (question: string) => {
    const reply = getChatbotReply(question);

    setMsgs((m) => [
      ...m,
      { role: "user", text: question },
      { role: "bot", text: reply.answer, suggestions: reply.suggestions },

    ]);
  };

  const sendInput = () => {
    const question = input.trim();

    if (!question) {
      return;
    }

    const reply = getChatbotReply(question);

    setMsgs((m) => [
      ...m,
      { role: "user", text: question },
      { role: "bot", text: reply.answer, suggestions: reply.suggestions },
    ]);
    setInput("");
  };

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label="AI 상담"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>코팡 AI 상담봇</div>
          <div className={styles.body}>
            {msgs.map((m, i) => (
              <div key={i}>
                <div className={`${styles.msg} ${m.role === "user" ? styles.user : styles.bot}`}>
                  {m.text}
                </div>

                {m.suggestions && (
                  <div className={styles.suggestions}>
                    {m.suggestions.slice(0,1).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className={styles.suggestionBtn}
                        onClick={() => ask(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={styles.quick}>
            {INITIAL_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                className={styles.quickBtn}
                onClick={() => ask(question)}
              >
                {question}
              </button>
            ))}
          </div>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendInput();
                }
              }}
              placeholder="궁금한 내용을 입력하세요"
            />
            <button type="button" className={styles.sendBtn} onClick={sendInput}>
              보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
