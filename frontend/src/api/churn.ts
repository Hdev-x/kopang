import { client } from "./client";
import type { ApiResponse } from "../types/api";

// 이탈 대시보드 집계 응답 — 백엔드 ChurnSummaryResponse와 1:1 대응
export type ChurnKpi = {
  highRiskCount: number; // 고위험 고객 수
  churnRate: number; // 주간 이탈율(%)
  conversionRate: number; // 대응 전환율(%)
  attributedRevenue: number; // 대응 귀속 매출
};

export type ChurnLevelCount = {
  riskLevel: "HIGH" | "MID" | "LOW";
  count: number;
};

// 위험 유형별 인원 — riskType null = ML 예측. 집계 기준: 현재 상태(유저별 최신 1건, 임시)
export type ChurnTypeCount = {
  riskType: string | null;
  count: number;
};

export type ChurnSegmentCount = {
  segment: "MEMBER" | "NORMAL";
  total: number;
  high: number;
};

export type ChurnTrendPoint = {
  metricDate: string; // ISO date
  churnRate: number;
};

export type ChurnEffectRow = {
  actionType: "COUPON" | "PUSH" | "MODAL" | "RECOMMEND";
  treatPct: number; // 처치군 전환율(%)
  controlPct: number; // 대조군 전환율(%)
  revenue: number;
};

export type ChurnAtRiskCustomer = {
  userId: number;
  name: string;
  score: number;
  riskLevel: "HIGH" | "MID" | "LOW";
  riskType: string;
  isMember: boolean;
};

export type ChurnSummary = {
  kpi: ChurnKpi;
  levelCounts: ChurnLevelCount[];
  typeCounts: ChurnTypeCount[];
  segments: ChurnSegmentCount[];
  weeklyChurnRate: ChurnTrendPoint[];
  effect: ChurnEffectRow[];
  atRisk: ChurnAtRiskCustomer[];
  lastRuleRunAt: string | null; // 마지막 감지 배치(RULE) 실행 시각
  ops: ChurnOpsSummary;
  mlCover: ChurnMlCover;
};

// 이탈 대시보드 요약 집계 (GET /api/admin/churn/summary)
export async function getChurnSummary() {
  const res = await client.get<ApiResponse<ChurnSummary>>("/admin/churn/summary");
  return res.data.data;
}

// ─── 대응 발송 실행 (A-1 대시보드 액션센터) ───

// 발송 실행 전 대상 현황 — 백엔드 InterventionPreviewResponse와 1:1 대응
export type InterventionPreview = {
  integratedCount: number; // 통합 발송 (FIRST_ORDER_ONLY)
  couponExpiringCount: number; // 쿠폰 만료 임박 (CHURN-14)
  loginInactiveCount: number; // 미로그인 복귀 유도 (CHURN-16)
};

// 통합 발송 실행 결과 — 백엔드 InterventionRunResult와 1:1 대응
export type InterventionRunResult = {
  targetCount: number; // 발송 후보 전원
  sentCount: number; // 처치군(실제 발송)
  controlCount: number; // 순수 대조군 (상한·배타 제외분은 미포함)
};

// 발송 대상 현황 조회 (GET /api/admin/churn/intervene/preview)
export async function getInterventionPreview() {
  const res = await client.get<ApiResponse<InterventionPreview>>("/admin/churn/intervene/preview");
  return res.data.data;
}

// 일 배치 실행 결과 — 스케줄러(매일 03:00)와 같은 메서드를 호출한다
export type BatchRunResult = {
  detected: number;         // 감지된 위험 판정 수
  mlScored: number;         // ML 스코어링 수 (서빙 불가 시 0)
  interventionOn: boolean;  // 자동 발송 스위치 상태
  sent: number;             // 발송(처치군)
  control: number;          // 대조군(기록만)
  measured: number;         // 이번 실행에서 전환 판정 확정
};

export type BatchResetResult = {
  interventions: number;
  outcomes: number;
  notifications: number;
  coupons: number;
};

// 일 배치 수동 실행 (POST /api/admin/churn/batch)
// 스케줄러와 같은 메서드를 한 번에 호출한다. 화면에서 단계별 진행을 보여줄 때는
// 아래 개별 단계 함수를 순서대로 부른다(같은 로직을 나눠 실행 — 진행률이 실제 값이 된다).
export async function runDailyBatch() {
  const res = await client.post<ApiResponse<BatchRunResult>>("/admin/churn/batch");
  return res.data.data;
}

// ── 배치 단계별 실행 (화면 진행 표시용) ──────────────────────────
// 감지 (룰 8종)
export async function runChurnDetect() {
  await client.post<ApiResponse<{ message: string }>>("/admin/churn/run");
}

// ML 스코어링 — 서빙(:8000)이 꺼져 있으면 실패하므로 호출부에서 건너뛸 수 있게 둔다
export async function runMlScoring() {
  const res = await client.post<ApiResponse<{ scored: number }>>("/admin/churn/ml-run");
  return res.data.data;
}

// 효과 측정
export async function measureOutcomes() {
  const res = await client.post<ApiResponse<{ measured: number }>>("/admin/churn/measure");
  return res.data.data;
}

// 지표 적재
export async function recordChurnMetrics() {
  await client.post<ApiResponse<{ status: string }>>("/admin/churn/metrics");
}

// 오늘 배치분 원복 (POST /api/admin/churn/batch/reset)
export async function resetDailyBatch() {
  const res = await client.post<ApiResponse<BatchResetResult>>("/admin/churn/batch/reset");
  return res.data.data;
}

// 통합 발송 실행 (POST /api/admin/churn/intervene)
export async function runIntervention() {
  const res = await client.post<ApiResponse<InterventionRunResult>>("/admin/churn/intervene");
  return res.data.data;
}

// 쿠폰 만료 임박 발송 실행 (POST /api/admin/churn/intervene/coupon-expiring)
export async function runCouponExpiringIntervention() {
  await client.post<ApiResponse<{ message: string }>>("/admin/churn/intervene/coupon-expiring");
}

// 미로그인 복귀 유도 발송 실행 (POST /api/admin/churn/intervene/login-inactive)
export async function runLoginInactiveIntervention() {
  await client.post<ApiResponse<{ message: string }>>("/admin/churn/intervene/login-inactive");
}

// ⑤ 대응 운영 현황 — 백엔드 OpsSummary와 1:1
export type ChurnOpsSummary = {
  sentToday: number;
  sentPushToday: number;
  sentCouponToday: number;
  controlToday: number;
  totalCount: number;
  convertedCount: number;
  highTotal: number;
  highCovered: number;
};

// ⑥ 룰 vs ML 감지 커버 — 백엔드 MlCover와 1:1
export type ChurnMlCover = {
  ruleOnly: number;
  mlOnly: number;
  both: number;
  blindspotSent: number;
  lastMlRunAt: string | null;
};
