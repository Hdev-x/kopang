import { useEffect, useState } from "react";
import { AdminLayout } from "../../../components/AdminLayout";
import { Skeleton, SkeletonRows } from "../../../components/Skeleton";
import { getPointStats, type PointStats, type PointTier, type PointTierStat } from "../../../api/adminPoints";
import styles from "../adminTable.module.css";
import layout from "./AdminPointsPage.module.css";

const TIER_LABEL: Record<PointTier, string> = {
  MEMBERSHIP: "멤버십 회원",
  GENERAL: "일반 회원",
};

/** 정책값과 같은 순서로 고정한다. 데이터가 한쪽만 있어도 두 줄이 다 보여야 비교가 된다. */
const TIER_ORDER: PointTier[] = ["MEMBERSHIP", "GENERAL"];

function emptyTier(tier: PointTier): PointTierStat {
  return {
    tier,
    memberCount: 0,
    earnCount: 0,
    earnedAmount: 0,
    averageEarned: 0,
    ratePercent: tier === "MEMBERSHIP" ? 5 : 1,
  };
}

export function AdminPointsPage() {
  const [data, setData] = useState<PointStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPointStats().then(setData).catch(() => setError(true));
  }, []);

  const tiers = TIER_ORDER.map(
    (tier) => data?.tiers.find((row) => row.tier === tier) ?? emptyTier(tier)
  );
  const [membership, general] = tiers;
  // 같은 금액을 샀을 때 몇 배가 쌓이는지. 시연에서 이 한 줄이 핵심이다.
  const rateGap = general.ratePercent > 0 ? membership.ratePercent / general.ratePercent : 0;

  const num = (value?: number) => (value ?? 0).toLocaleString();

  return (
    <AdminLayout title="포인트 관리" fullBleed>
      <div className={styles.page}>
        <div className={styles.kpis}>
          <div className={styles.kCell}>
            <p className={styles.kLabel}>총 적립</p>
            <p className={styles.kValue}>{data ? `${num(data.totalEarned)}P` : <Skeleton w={110} h={22} />}</p>
            <p className={styles.kSub}>적립 {num(data?.earnCount)}건 (가입·리뷰 포함)</p>
          </div>
          <div className={styles.kCell}>
            <p className={styles.kLabel}>총 사용</p>
            <p className={styles.kValue}>{data ? `${num(data.totalUsed)}P` : <Skeleton w={110} h={22} />}</p>
            <p className={styles.kSub}>주문 결제에 사용된 금액</p>
          </div>
          <div className={styles.kCell}>
            <p className={styles.kLabel}>미사용 잔액</p>
            <p className={styles.kValue}>{data ? `${num(data.totalBalance)}P` : <Skeleton w={110} h={22} />}</p>
            <p className={styles.kSub}>적립 − 사용</p>
          </div>
          <div className={styles.kCell}>
            <p className={styles.kLabel}>적립률 차이</p>
            <p className={styles.kValue}>{data ? `${rateGap}배` : <Skeleton w={70} h={22} />}</p>
            <p className={styles.kSub}>멤버십 {membership.ratePercent}% · 일반 {general.ratePercent}%</p>
          </div>
        </div>

        <div className={`${styles.toolbar} ${styles.sectionGap} ${layout.fixedRow}`}>
          <strong className={styles.sectionTitle}>멤버십 · 일반 회원 적립 비교</strong>
          <span className={styles.spacer} />
          <span className={styles.caption}>구매확정 적립만 집계 (가입·리뷰·이벤트 적립 제외)</span>
        </div>
        <div className={`${styles.tableWrap} ${layout.compareWrap}`}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th>구분</th>
                <th>적립률</th>
                <th>대상 회원</th>
                <th>적립 건수</th>
                <th>적립 합계</th>
                <th>건당 평균</th>
              </tr>
            </thead>
            <tbody>
              {!data && !error ? (
                <SkeletonRows rows={2} cols={6} widths={["50%", "40%", "40%", "40%", "55%", "50%"]} />
              ) : (
                tiers.map((row) => (
                  <tr key={row.tier}>
                    <td>
                      <span className={`${styles.badge} ${row.tier === "MEMBERSHIP" ? styles.bInfo : styles.bMuted}`}>
                        {TIER_LABEL[row.tier]}
                      </span>
                    </td>
                    <td>{row.ratePercent}%</td>
                    <td>{num(row.memberCount)}명</td>
                    <td>{num(row.earnCount)}건</td>
                    <td>{num(row.earnedAmount)}P</td>
                    <td>{num(row.averageEarned)}P</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`${styles.toolbar} ${styles.sectionGap} ${layout.fixedRow}`}>
          <strong className={styles.sectionTitle}>최근 포인트 내역</strong>
          <span className={styles.spacer} />
          <span className={styles.caption}>
            구매확정 시점에 적립된다(결제 시점 아님) · 최근 {num(data?.recentLogs.length)}건
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th>회원</th>
                <th>구분</th>
                <th>유형</th>
                <th>증감</th>
                <th>내용</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {!data && !error ? (
                <SkeletonRows rows={10} cols={6} widths={["45%", "40%", "35%", "40%", "70%", "55%"]} />
              ) : data && data.recentLogs.length > 0 ? (
                data.recentLogs.map((log) => (
                  <tr key={log.pointId}>
                    <td>{log.userName}</td>
                    <td>
                      <span className={`${styles.badge} ${log.tier === "MEMBERSHIP" ? styles.bInfo : styles.bMuted}`}>
                        {TIER_LABEL[log.tier]}
                      </span>
                    </td>
                    <td>{log.type}</td>
                    <td className={log.amount < 0 ? styles.bRisk : undefined}>
                      {log.amount > 0 ? `+${num(log.amount)}` : num(log.amount)}P
                    </td>
                    <td className={styles.ellip}>{log.description}</td>
                    <td>{log.createdAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.empty}>
                    {error ? "포인트 내역을 불러오지 못했습니다." : "포인트 내역이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
