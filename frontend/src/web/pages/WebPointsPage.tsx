import { useEffect, useState } from "react";
import { Coins, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { getPointBalance, getPointHistory, type PointHistoryResponse } from "../../api/point";
import { useAuth } from "../../hooks/useAuth";
import { WebLayout } from "../components/WebLayout";
import { WebShoppingNav } from "./WebAccountPages";
import styles from "./WebPointsPage.module.css";

export function WebPointsPage() {
  const user = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointHistoryResponse[]>([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) return;
    Promise.all([getPointBalance(), getPointHistory()])
      .then(([balanceData, historyData]) => { setBalance(balanceData.balance); setHistory(historyData); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <WebLayout><div className={styles.center}><Coins size={42} /><h1>로그인 후 포인트를 확인할 수 있어요.</h1><Link to="/web/login">로그인하기</Link></div></WebLayout>;
  return <WebLayout>
    <WebShoppingNav activeKind="points" />
    <header className={styles.header}><p>MY POINT</p><h1>포인트</h1><span>적립하고 사용한 포인트 내역을 확인합니다.</span></header>
    <section className={styles.balance}><div><span>사용 가능 포인트</span><strong>{balance.toLocaleString()}P</strong></div><Coins size={48} /></section>
    <section className={styles.history}><header><h2>포인트 내역</h2><span>최신순</span></header>
      {loading ? <div className={styles.empty}>포인트 내역을 불러오는 중이에요.</div> : history.length === 0 ? <div className={styles.empty}>포인트 변동 내역이 없어요.</div> : history.map((item) => <article key={item.pointId}><div className={item.amount >= 0 ? styles.earn : styles.spend}>{item.amount >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}</div><div><strong>{item.description}</strong><span>{item.createdAt.slice(0, 10)} · {item.type}</span></div><b className={item.amount >= 0 ? styles.plus : styles.minus}>{item.amount >= 0 ? "+" : ""}{item.amount.toLocaleString()}P</b></article>)}
    </section>
  </WebLayout>;
}
