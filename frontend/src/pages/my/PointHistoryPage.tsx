import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { getPointBalance, getPointHistory, type PointHistoryResponse } from "../../api/point";
import { useAuth } from "../../hooks/useAuth";
import s from "../../styles/AccountPages.module.css";

export function PointHistoryPage() {
  const user = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointHistoryResponse[]>([]);

  // 실시간 포인트 데이터 로드
  const loadPointData = async () => {
    try {
      const balanceData = await getPointBalance();
      const historyData = await getPointHistory();
      setBalance(balanceData.balance);
      setHistory(historyData);
    } catch (err) {
      console.error("포인트 정보를 불러오지 못했습니다.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    loadPointData();
  }, [user]);

  // 로그인 체크 게이트
  if (!user) {
    return (
      <Layout>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px",
          textAlign: "center"
        }}>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>로그인이 필요한 페이지예요.</p>
          <Button onClick={() => navigate("/login")}>로그인하러 가기</Button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <PageHeader title="포인트 내역" />
        <div style={{ textAlign: "center", padding: "80px", color: "var(--color-text-muted)" }}>로딩 중...</div>
      </Layout>
    );
  }

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <Layout>
      <PageHeader title="포인트 내역" />
      <div className={s.summary}>
        <div className={s.summaryNum}>{balance.toLocaleString()}P</div>
        <div className={s.summaryLabel}>사용 가능 포인트</div>
      </div>

      <div className={s.list}>
        {history.length === 0 ? (
          <div className={s.empty}>포인트 변동 내역이 없습니다.</div>
        ) : (
          history.map((p) => (
            <Card key={p.pointId}>
              <div className={s.row}>
                <div className={s.col}>
                  <span>{p.description}</span>
                  <span className={s.muted}>{formatDate(p.createdAt)}</span>
                </div>
                <span className={p.amount >= 0 ? s.plus : s.minus}>
                  {p.amount >= 0 ? "+" : ""}
                  {p.amount.toLocaleString()}P
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}
