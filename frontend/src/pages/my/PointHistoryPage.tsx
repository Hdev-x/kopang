import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { getPointBalance, getPointHistory, earnPoint, spendPoint, type PointHistoryResponse } from "../../api/point";
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

  // 모의 적립 핸들러
  const handleEarn = async () => {
    try {
      await earnPoint(1000, "이벤트 참여 보너스 적립");
      alert("1,000P가 적립되었습니다!");
      loadPointData();
    } catch {
      alert("포인트 적립에 실패했습니다.");
    }
  };

  // 모의 사용 핸들러
  const handleUse = async () => {
    try {
      await spendPoint(500, "포인트 샵 모의 차감");
      alert("500P가 사용되었습니다!");
      loadPointData();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(err.response?.data?.message || "포인트 사용에 실패했습니다. 잔액을 확인해 주세요.");
    }
  };

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

      {/* 모의 테스트 구역 (발표용 실시간 변동 제어) */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "25px",
        padding: "15px",
        borderRadius: "var(--radius-md, 8px)",
        border: "1px dashed var(--color-border, #eee)",
        backgroundColor: "var(--gray-50, #fafafa)"
      }}>
        <Button style={{ flex: 1 }} onClick={handleEarn}>+1,000P 적립</Button>
        <Button variant="ghost" style={{ flex: 1, borderColor: "var(--color-primary)" }} onClick={handleUse}>-500P 사용</Button>
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
