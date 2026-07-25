import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TicketPercent } from "lucide-react";
import { AdminLayout } from "../../../components/AdminLayout";
import {
  getRiskCustomerDetail,
  getRiskCustomers,
  type RiskCustomer,
  type RiskCustomerDetail,
} from "../../../api/adminChurn";
import { getChurnSummary, type ChurnEffectRow } from "../../../api/churn";
import sh from "../adminShared.module.css";
import styles from "./AdminChurnCustomersPage.module.css";

// 위험 등급 코드 → 라벨
const LEVEL_LABEL: Record<string, string> = { HIGH: "고위험", MID: "중위험", LOW: "저위험" };

// 위험 유형 코드 → 라벨
const RISK_TYPE_LABEL: Record<string, string> = {
  CART_ABANDON: "장바구니 방치",
  MEMBERSHIP_CANCEL: "멤버십 해지",
  FIRST_ORDER_ONLY: "첫구매 미복귀",
  WISHLIST_IDLE: "찜 방치",
  COUPON_EXPIRING: "쿠폰 만료임박",
  BAD_EXPERIENCE: "부정경험",
  LOGIN_INACTIVE: "접속 뜸",
  SPENDING_DROP: "구매액 감소",
  ML_HIGH: "ML 고위험",
};

const ACTION_LABEL: Record<string, string> = {
  COUPON: "쿠폰 발송",
  PUSH: "앱 알림",
  MODAL: "복귀 모달",
  RECOMMEND: "맞춤 추천",
};

const OUTCOME_LABEL: Record<string, string> = { CONTROL: "대조군", CONVERTED: "전환", NO_RESPONSE: "미반응" };

function outcomeBadge(o: string) {
  if (o === "CONVERTED") return sh.bOk;
  if (o === "NO_RESPONSE") return sh.bWarn;
  return sh.bMuted;
}

function pbClass(level: string) {
  return level === "HIGH" ? styles.hi : level === "MID" ? styles.mi : styles.lo;
}

function fmtDate(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10) : "—";
}

function fmtDateTime(iso: string) {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

// 멤버십 세그먼트 (기존 필터 유지)
const TYPE_TABS = [
  { label: "전체", value: undefined },
  { label: "일반", value: "NORMAL" },
  { label: "멤버십", value: "MEMBER" },
];
const LEVEL_TABS = [
  { label: "전체", value: undefined },
  { label: "고위험", value: "HIGH" },
  { label: "중위험", value: "MID" },
];

// 첫 감지일로부터 오늘까지 경과일 (D+N 표기)
function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso.slice(0, 10)).getTime()) / 86_400_000);
}

export function AdminChurnCustomersPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [memberType, setMemberType] = useState("전체");
  const [riskType, setRiskType] = useState("");
  const [level, setLevel] = useState("전체");
  const [rows, setRows] = useState<RiskCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [detail, setDetail] = useState<RiskCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [effect, setEffect] = useState<ChurnEffectRow[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [showAllInterest, setShowAllInterest] = useState(false);

  const selectedId = userId ? Number(userId) : null;

  // 필터가 바뀔 때마다 목록 재조회
  useEffect(() => {
    const memberTypeValue = TYPE_TABS.find((t) => t.label === memberType)?.value;
    const levelValue = LEVEL_TABS.find((l) => l.label === level)?.value;
    setLoading(true);
    setError(false);
    getRiskCustomers({ type: riskType || undefined, memberType: memberTypeValue, level: levelValue, size: 100 })
      .then((data) => {
        setRows(data.content);
        setTotal(data.totalElements);
      })
      .catch((err) => {
        console.error("위험 고객 목록을 불러오지 못했습니다.", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [memberType, riskType, level]);

  // 선택이 없으면 목록 첫 고객 자동 선택 (URL 동기화)
  useEffect(() => {
    if (!selectedId && rows.length > 0) {
      navigate(`/admin/churn/customers/${rows[0].userId}`, { replace: true });
    }
  }, [selectedId, rows, navigate]);

  // 선택 고객 상세 조회
  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    setShowRaw(false);
    setShowAllInterest(false);
    getRiskCustomerDetail(selectedId)
      .then(setDetail)
      .catch((err) => {
        console.error("위험 고객 상세를 불러오지 못했습니다.", err);
        setDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  // 추천 처치 근거: 효과 리포트의 액션별 처치군-대조군 순효과 (1회 로드)
  useEffect(() => {
    getChurnSummary()
      .then((s) => setEffect(s.effect))
      .catch((err) => console.error("대응 효과 로드 실패", err));
  }, []);

  // 순효과가 가장 큰(양수) 액션 → 추천 처치
  const bestAction = useMemo(() => {
    const ranked = effect
      .map((e) => ({ ...e, lift: e.treatPct - e.controlPct }))
      .sort((a, b) => b.lift - a.lift);
    return ranked.length > 0 && ranked[0].lift > 0 ? ranked[0] : null;
  }, [effect]);

  const latest = detail?.scoreHistory[0];
  const listSummary = rows.find((r) => r.userId === selectedId);

  return (
    <AdminLayout title="위험 고객" fullBleed>
      <div className={styles.page}>
      <div className={styles.split}>
        {/* 좌측: 목록 */}
        <div className={styles.listCol}>
          <div className={styles.listHead}>
            <div className={styles.listTitle}>
              <b>위험 고객</b>
              <small>{total.toLocaleString()}명 · 확률 높은 순</small>
            </div>
            <div className={styles.seg}>
              {TYPE_TABS.map((t) => (
                <button key={t.label} className={memberType === t.label ? styles.on : ""} onClick={() => setMemberType(t.label)}>
                  {t.label}
                </button>
              ))}
              {LEVEL_TABS.filter((l) => l.value).map((l) => (
                <button key={l.label} className={level === l.label ? styles.on : ""} onClick={() => setLevel(level === l.label ? "전체" : l.label)}>
                  {l.label}
                </button>
              ))}
            </div>
            <select className={styles.typeSelect} value={riskType} onChange={(e) => setRiskType(e.target.value)} aria-label="위험 유형">
              <option value="">위험 유형 전체</option>
              {Object.entries(RISK_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className={styles.listBody}>
            {loading ? (
              <p className={styles.emptyText}>불러오는 중…</p>
            ) : error ? (
              <p className={styles.emptyText}>목록을 불러오지 못했습니다.</p>
            ) : rows.length === 0 ? (
              <p className={styles.emptyText}>해당 조건의 위험 고객이 없습니다.</p>
            ) : (
              rows.map((c) => (
                <button
                  key={c.userId}
                  type="button"
                  className={`${styles.li} ${c.userId === selectedId ? styles.sel : ""}`}
                  onClick={() => navigate(`/admin/churn/customers/${c.userId}`)}
                >
                  <span className={styles.av}>{c.name.slice(0, 1)}</span>
                  <span className={styles.who}>
                    <b>
                      {c.name}{" "}
                      <span className={`${styles.memBadge} ${c.isMember ? styles.memOn : styles.memOff}`}>
                        {c.isMember ? "멤버십" : "일반"}
                      </span>
                    </b>
                    <span className={styles.liType}>{c.riskType ? RISK_TYPE_LABEL[c.riskType] ?? c.riskType : "ML 이탈 예측"}</span>
                  </span>
                  <span className={styles.liRight}>
                    <small className={styles.liDate}>감지일: {fmtDate(c.detectedAt)}</small>
                    <span className={`${styles.pb} ${pbClass(c.riskLevel)}`}>{c.score.toFixed(2)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 우측: 상세 */}
        <div className={styles.detailCol}>
          {detailLoading ? (
            <p className={styles.emptyText}>상세 불러오는 중…</p>
          ) : !detail ? (
            <p className={styles.emptyText}>좌측 목록에서 고객을 선택하세요.</p>
          ) : (
            <>
              <div className={styles.dHead}>
                <span className={styles.lav}>{detail.profile.name.slice(0, 1)}</span>
                <div className={styles.dName}>
                  <b>
                    {detail.profile.name}{" "}
                    <span className={`${styles.memBadge} ${detail.profile.isMember ? styles.memOn : styles.memOff}`}>
                      {detail.profile.isMember ? "멤버십" : "일반"}
                    </span>{" "}
                    {latest && <span className={`${styles.pb} ${pbClass(latest.riskLevel)}`}>{latest.score.toFixed(2)}</span>}
                  </b>
                  <small>
                    {detail.profile.email} · 가입 {fmtDate(detail.profile.joinedAt)} · 최근 로그인 {fmtDate(detail.profile.lastLoginAt)}
                  </small>
                </div>
                <div className={styles.headStats}>
                  <div className={styles.headStat}>
                    <p className={styles.mLabel}>총 구매액</p>
                    <div className={styles.mValue}>{detail.orderSummary.totalSpent.toLocaleString()}원</div>
                  </div>
                  <div className={styles.headStat}>
                    <p className={styles.mLabel}>주문 수</p>
                    <div className={styles.mValue}>{detail.orderSummary.orderCount.toLocaleString()}건</div>
                  </div>
                  <div className={styles.headStat}>
                    <p className={styles.mLabel}>평균 주문액</p>
                    <div className={styles.mValue}>{detail.orderSummary.avgAmount.toLocaleString()}원</div>
                  </div>
                  <div className={styles.headStat}>
                    <p className={styles.mLabel}>최근 주문</p>
                    <div className={styles.mValue}>{fmtDate(detail.orderSummary.lastOrderedAt)}</div>
                  </div>
                </div>
              </div>

              <div className={styles.dBody}>
                  <div className={styles.dSec}>
                    <span className={styles.secLabel}>
                      위험 신호 (유형별 · 최근 이력 기준)
                      {detail.scoreHistory.length > 0 && (
                        <button type="button" className={styles.rawToggle} onClick={() => setShowRaw((v) => !v)}>
                          {showRaw ? "요약 보기" : "전체 이력 보기"}
                        </button>
                      )}
                    </span>
                    {detail.scoreHistory.length === 0 ? (
                      <p className={sh.itemMeta}>감지된 위험 신호가 없습니다.</p>
                    ) : showRaw ? (
                      <div className={sh.tableWrap}>
                        <table className={sh.table}>
                          <thead>
                            <tr><th>판정일시</th><th>점수</th><th>등급</th><th>위험 유형</th><th>출처</th></tr>
                          </thead>
                          <tbody>
                            {detail.scoreHistory.map((p, i) => (
                              <tr key={i}>
                                <td>{fmtDateTime(p.scoredAt)}</td>
                                <td><span className={`${styles.pb} ${pbClass(p.riskLevel)}`}>{p.score.toFixed(2)}</span></td>
                                <td>{LEVEL_LABEL[p.riskLevel] ?? p.riskLevel}</td>
                                <td>{p.riskType ? RISK_TYPE_LABEL[p.riskType] ?? p.riskType : "ML 이탈 예측"}</td>
                                <td><span className={`${sh.badge} ${p.source === "ML" ? sh.bInfo : sh.bMuted}`}>{p.source}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={styles.sigList}>
                        {detail.signals.map((s) => (
                          <div key={s.riskType ?? "ML"} className={styles.sigRow}>
                            <span className={`${styles.pb} ${pbClass(s.latestLevel)}`}>{s.latestScore.toFixed(2)}</span>
                            <span className={styles.sigLabel}>
                              {s.riskType ? RISK_TYPE_LABEL[s.riskType] ?? s.riskType : "ML 이탈 예측"}
                            </span>
                            <small className={styles.sigMeta}>
                              첫 감지 {fmtDate(s.firstDetectedAt)} (D+{daysSince(s.firstDetectedAt)}) · {s.detectCount.toLocaleString()}회
                              {" · "}
                              {s.lastInterventionAt
                                ? `대응 ${fmtDate(s.lastInterventionAt)} ${OUTCOME_LABEL[s.lastOutcome ?? ""] ?? ""}`
                                : "대응 없음"}
                            </small>
                            <span className={`${sh.badge} ${s.source === "ML" ? sh.bInfo : sh.bMuted}`}>{s.source}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.dSec}>
                    <span className={styles.secLabel}>최근 만족도</span>
                    {detail.satisfaction ? (
                      <div className={styles.sat}>
                        <span className={styles.satScore}>{detail.satisfaction.score.toFixed(1)}</span>
                        <span className={styles.satStars}>{"★".repeat(detail.satisfaction.score)}{"☆".repeat(5 - detail.satisfaction.score)}</span>
                        <span className={styles.satReason}>
                          {detail.satisfaction.reason ? <><b>사유:</b> {detail.satisfaction.reason}</> : "사유 미선택"}
                        </span>
                        <span className={styles.satDate}>{fmtDate(detail.satisfaction.createdAt)}</span>
                      </div>
                    ) : (
                      <p className={sh.itemMeta}>제출된 만족도 조사가 없습니다.</p>
                    )}
                  </div>

                  <div className={styles.dSec}>
                    <span className={styles.secLabel}>
                      현재 관심 상품 (장바구니·찜)
                      {detail.interestProducts.length > 3 && (
                        <button type="button" className={styles.rawToggle} onClick={() => setShowAllInterest((v) => !v)}>
                          {showAllInterest ? "접기" : `더보기 (+${detail.interestProducts.length - 3})`}
                        </button>
                      )}
                    </span>
                    {detail.interestProducts.length === 0 ? (
                      <p className={sh.itemMeta}>장바구니·찜한 상품이 없습니다.</p>
                    ) : (
                      <div className={styles.interestList}>
                        {(showAllInterest ? detail.interestProducts : detail.interestProducts.slice(0, 3)).map((p, i) => (
                          <div key={`${p.source}-${p.productId}-${i}`} className={styles.interestItem}>
                            <span className={`${styles.srcTag} ${p.source === "CART" ? styles.srcCart : styles.srcWish}`}>
                              {p.source === "CART" ? "장바구니" : "찜"}
                            </span>
                            <span className={styles.interestName}>{p.name}</span>
                            <span className={styles.interestPrice}>
                              {(p.discountPrice ?? p.price).toLocaleString()}원
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={styles.dSec}>
                    <span className={styles.secLabel}>추천 처치</span>
                    {bestAction ? (
                      <div className={styles.suggest}>
                        <span className={styles.suggestIcon}><TicketPercent size={17} /></span>
                        <div className={styles.suggestBody}>
                          <b>{ACTION_LABEL[bestAction.actionType] ?? bestAction.actionType}</b>
                          <small>대응 효과 리포트 기준 순효과 +{(bestAction.treatPct - bestAction.controlPct).toFixed(1)}%p (처치군 {bestAction.treatPct}% vs 대조군 {bestAction.controlPct}%)</small>
                        </div>
                      </div>
                    ) : (
                      <p className={sh.itemMeta}>순효과가 양수인 대응이 아직 없습니다.</p>
                    )}
                  </div>

                <div className={styles.dSec}>
                  <span className={styles.secLabel}>받은 대응 이력</span>
                  {detail.interventions.length === 0 ? (
                    <p className={sh.itemMeta}>받은 대응 이력이 없습니다.</p>
                  ) : (
                    <div className={sh.tableWrap}>
                      <table className={sh.table}>
                        <thead>
                          <tr><th>일시</th><th>위험 유형</th><th>대응</th><th>채널</th><th>결과</th></tr>
                        </thead>
                        <tbody>
                          {detail.interventions.map((it, i) => (
                            <tr key={i}>
                              <td>{fmtDateTime(it.createdAt)}</td>
                              <td>{RISK_TYPE_LABEL[it.riskType] ?? it.riskType}</td>
                              <td>{ACTION_LABEL[it.actionType] ?? it.actionType}</td>
                              <td>{it.channel}</td>
                              <td><span className={`${sh.badge} ${outcomeBadge(it.outcome)}`}>{OUTCOME_LABEL[it.outcome] ?? it.outcome}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              {listSummary && (
                <p className={styles.emptyText} style={{ paddingTop: 0 }}>
                  현재 감지: {listSummary.riskType ? RISK_TYPE_LABEL[listSummary.riskType] ?? listSummary.riskType : "ML 이탈 예측"} · 대응 상태 {listSummary.status === "SENT" ? "발송됨" : listSummary.status === "CONTROL" ? "대조군" : "예정"}
                </p>
              )}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
