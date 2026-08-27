import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import styles from "./Layout.module.css";

// 검색 입력창. value는 로컬 상태로 직접 제어해 한글 IME 조합이 끊기지 않게 하고,
// URL(?q=)·결과 동기화는 조합이 끝났을 때(또는 영문 입력 시) 별도로 반영한다.
export function SearchBarInput() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [text, setText] = useState(searchParams.get("q") ?? "");
  const composing = useRef(false);

  const sync = (v: string) => setSearchParams(v ? { q: v } : {}, { replace: true });

  // 추천어/최근검색어 클릭 등 외부에서 q가 바뀌면 입력창에도 반영 (조합 중에는 건드리지 않음)
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (!composing.current && urlQ !== text) setText(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className={styles.search}>
      <Search size={18} strokeWidth={2.2} className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        placeholder="상품을 검색해보세요"
        value={text}
        autoFocus
        onChange={(e) => {
          const v = e.target.value;
          setText(v); // 로컬 값은 항상 갱신 (조합 유지)
          if (v.trim() === "") {
            sync(""); // 입력이 완전히 비워지면 즉시 URL 반영하여 초기화
          }
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sync(text.trim());
          }
        }}
      />
    </div>
  );
}
