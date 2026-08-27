import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { askChatbot } from "../../api/chatbot";
import { getChatbotReply, INITIAL_QUESTIONS } from "../../api/chatbotRules";
import styles from "./WebChatbot.module.css";

type Message = { role: "bot" | "user"; text: string; suggestions?: string[] };

export function WebChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "bot", text: "안녕하세요. Kopang AI 상담봇이에요. 무엇을 도와드릴까요?" }]);

  useEffect(() => {
    const openChatbot = () => setOpen(true);
    window.addEventListener("open-web-chatbot", openChatbot);
    return () => window.removeEventListener("open-web-chatbot", openChatbot);
  }, []);

  const ask = async (question: string) => {
    const value = question.trim();
    if (!value || sending) return;
    setMessages((current) => [...current, { role: "user", text: value }]);
    setInput("");
    setSending(true);
    try {
      const reply = await askChatbot(value);
      setMessages((current) => [...current, { role: "bot", text: reply.answer, suggestions: reply.suggestions }]);
    } catch {
      const reply = getChatbotReply(value);
      setMessages((current) => [...current, { role: "bot", text: reply.answer, suggestions: reply.suggestions }]);
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent) => { event.preventDefault(); void ask(input); };

  return <div className={styles.root}>
    {open && <section className={styles.panel} role="dialog" aria-label="Kopang AI 상담봇">
      <header><div><Bot size={20} /><span>Kopang AI 상담봇</span></div><button type="button" onClick={() => setOpen(false)} aria-label="챗봇 닫기"><X size={20} /></button></header>
      <div className={styles.messages}>{messages.map((message, index) => <div key={`${message.role}-${index}`} className={styles.messageGroup}><p className={message.role === "user" ? styles.user : styles.bot}>{message.text}</p>{message.suggestions && <div className={styles.suggestions}>{message.suggestions.slice(0, 2).map((item) => <button type="button" key={item} onClick={() => void ask(item)}>{item}</button>)}</div>}</div>)}{sending && <p className={styles.bot}>답변을 확인하고 있어요...</p>}</div>
      <div className={styles.quick}>{INITIAL_QUESTIONS.slice(0, 3).map((question) => <button type="button" key={question} onClick={() => void ask(question)}>{question}</button>)}</div>
      <form onSubmit={submit}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="궁금한 내용을 입력하세요" /><button type="submit" disabled={sending} aria-label="질문 보내기"><Send size={18} /></button></form>
    </section>}
    <button type="button" className={styles.trigger} onClick={() => setOpen((value) => !value)} aria-label={open ? "챗봇 닫기" : "AI 상담 열기"}>{open ? <X size={24} /> : <MessageCircle size={24} />}</button>
  </div>;
}
