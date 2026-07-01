import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import styles from "./ChatbotWidget.module.css";

type Msg = { role: "bot" | "user"; text: string };

// 목업 — 정해진 질문/답변 (실제론 GPT API)
const QUICK = [
  { q: "배송은 얼마나 걸려요?", a: "주문 후 보통 1~2일 내 도착해요. WOW 멤버십은 무료배송이에요!" },
  { q: "반품하고 싶어요", a: "마이페이지 > 주문내역에서 반품 신청이 가능해요. 멤버십은 무료 반품!" },
  { q: "포인트는 어떻게 쌓여요?", a: "구매 시 2%, 리뷰 작성 시 추가로 적립돼요." },
  { q: "추천 상품 알려줘", a: "최근 보신 상품을 바탕으로 홈에서 맞춤 추천을 보여드리고 있어요 🙂" },
];

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "안녕하세요! 코팡 AI 상담봇이에요. 무엇을 도와드릴까요?" },
  ]);

  const ask = (q: string, a: string) => {
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "bot", text: a }]);
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
              <div
                key={i}
                className={`${styles.msg} ${m.role === "user" ? styles.user : styles.bot}`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className={styles.quick}>
            {QUICK.map((q) => (
              <button
                key={q.q}
                type="button"
                className={styles.quickBtn}
                onClick={() => ask(q.q, q.a)}
              >
                {q.q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
