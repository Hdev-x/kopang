#!/usr/bin/env python3
"""
seed_metrics.py — churn_daily_metric 백필 (실제 집계)

배경:
  대시보드 KPI 4종(고위험 수·이탈률·전환율·기여 매출)과 주간 이탈률 추이는
  churn_daily_metric 을 읽는다. 그런데 이 테이블에 INSERT 하는 코드가
  초기 시드(ml/seed/seed_db.py)뿐이라, 시드 시점(2026-07-02) 이후로 갱신이 멈춰 있다.
  → 대시보드가 몇 주 전 숫자를 "오늘"인 것처럼 보여준다.

  이 스크립트는 그 구멍을 **실제 테이블 집계로** 메운다. 난수 생성이 아니다.
  (앞으로 매일 쌓는 것은 배치의 몫 — 이 스크립트는 과거 소급 백필 전용)

집계 정의 (대시보드 화면과 같은 기준을 쓴다):
  at_risk_high/mid   그 날짜 기준 **최근 7일 내 RULE 판정**의 user별 최신 1건
                     — 대시보드 levelCounts 와 동일 정의. "그날 스코어링된 수"가 아니다.
                     7일 창을 두는 이유: 이 조건이 없으면 한 번 걸린 사람이 회복해도 영원히
                     위험군으로 남아 지표가 단조 증가한다("대응해도 위험군이 안 준다").
                     source='RULE' 로 한정하는 이유: ML 전수 스코어링이 룰 판정을 덮으면
                     그날만 위험군이 3배로 튀었다가 다음날 복귀한다(07-23 실측 12.09% → 3.20%).
                     매일 도는 룰을 기준선으로 삼고, ML 발굴분은 사각지대 지표가 따로 담당한다.
  total_users        그 날짜까지 가입한 일반 회원(ROLE_USER) 수
                     — 배치(ChurnMetricMapper.upsertTodayMetric)와 같은 기준. 관리자 계정 제외.
  churn_rate         at_risk_high / total_users * 100 (고위험 비율, 소수 2자리)
  intervention_count 그날 발송된 대응 건수
  conversion_count   그 대응 중 전환된 건수
  attributed_revenue 전환된 대응의 매출 합
  retained_count     그 대응 중 유지된 건수

안전 규칙 (daily_activity.py / seed_outcomes.py 와 동일 철학):
  - 기존 행은 절대 UPDATE/DELETE 안 함 — ON CONFLICT DO NOTHING 으로 INSERT 만
  - 초기 시드 구간(~2026-07-02)은 건드리지 않는다. 기본 시작일이 그 다음 날이다
  - 되돌리기: --undo 는 지정 범위만 삭제 (기본 범위 = 시드 이후 구간이라 시드가 안 지워진다)

사용 (프로젝트 루트에서):
  ml/.venv/bin/python ml/demo/seed_metrics.py --dry-run   # 계산 결과만 출력 (쓰기 없음)
  ml/.venv/bin/python ml/demo/seed_metrics.py             # 백필 실행
  ml/.venv/bin/python ml/demo/seed_metrics.py --undo      # 백필분 삭제
  ... --from 2026-07-03 --to 2026-07-28                   # 범위 지정 (기본값이 이것)

주의: 공유 Supabase 에 쓰므로 팀 공지 후 실행. 먼저 --dry-run.
"""
import sys
from datetime import date

from daily_activity import connect

# 기본 범위 — 초기 시드가 끝난 다음 날부터 오늘까지
DEFAULT_FROM = date(2026, 7, 3)
SEED_LAST_DAY = date(2026, 7, 2)  # 이 날짜 이전은 초기 시드 구간 (보호 대상)

# 일자별 지표를 한 번에 계산하는 쿼리.
# LATERAL 안의 DISTINCT ON (user_id) ... ORDER BY user_id, scored_at DESC 가
# "그 날짜 시점의 유저별 최신 판정 1건"을 뽑는 부분이다.
AGGREGATE_SQL = """
WITH d AS (SELECT generate_series(%s::date, %s::date, '1 day')::date AS md)
SELECT
  d.md,
  (SELECT COUNT(*) FROM users u
     WHERE u.created_at::date <= d.md AND u.role = 'ROLE_USER')            AS total_users,
  lvl.high,
  lvl.mid,
  itv.cnt,
  itv.conv,
  itv.revenue,
  itv.retained
FROM d
CROSS JOIN LATERAL (
  SELECT COUNT(*) FILTER (WHERE risk_level = 'HIGH') AS high,
         COUNT(*) FILTER (WHERE risk_level = 'MID')  AS mid
  FROM (SELECT DISTINCT ON (user_id) user_id, risk_level
          FROM churn_score
         WHERE scored_at::date <= d.md AND source = 'RULE'
           AND scored_at > d.md - INTERVAL '7 days'   -- 그 시점 기준 7일 내 재감지분만 (회복 반영)
         ORDER BY user_id, scored_at DESC, churn_score_id DESC) latest
) lvl
CROSS JOIN LATERAL (
  SELECT COUNT(*)                                                   AS cnt,
         COUNT(*) FILTER (WHERE o.converted)                        AS conv,
         COALESCE(SUM(o.revenue_amount) FILTER (WHERE o.converted), 0) AS revenue,
         COUNT(*) FILTER (WHERE o.retained)                         AS retained
  FROM retention_intervention r
  LEFT JOIN intervention_outcome o ON o.intervention_id = r.intervention_id
  WHERE r.created_at::date = d.md
) itv
ORDER BY d.md
"""


def parse_range():
    """--from / --to 파싱. 기본은 시드 다음 날 ~ 오늘."""
    args = sys.argv
    d_from, d_to = DEFAULT_FROM, date.today()
    for flag, setter in (("--from", "from"), ("--to", "to")):
        if flag in args:
            i = args.index(flag)
            if i + 1 < len(args):
                y, m, dd = (int(x) for x in args[i + 1].split("-"))
                if setter == "from":
                    d_from = date(y, m, dd)
                else:
                    d_to = date(y, m, dd)
    if d_from <= SEED_LAST_DAY:
        sys.exit(f"중단: 시작일({d_from})이 초기 시드 구간({SEED_LAST_DAY} 이전)을 침범한다. "
                 f"시드 데이터를 보호하려면 {SEED_LAST_DAY} 다음 날 이후로 지정한다.")
    return d_from, d_to


def compute(conn, d_from, d_to):
    cur = conn.cursor()
    cur.execute(AGGREGATE_SQL, (d_from, d_to))
    rows = []
    for md, total, high, mid, cnt, conv, revenue, retained in cur.fetchall():
        rate = round(high * 100.0 / total, 2) if total else 0.0
        rows.append((md, total, high, mid, rate, cnt, conv, revenue, retained))
    return rows


def show(rows, d_from, d_to):
    print(f"[dry-run] 쓰기 없음 — {d_from} ~ {d_to} ({len(rows)}일) 집계 결과\n")
    print("  날짜         가입자  HIGH   MID   이탈률  대응  전환   기여매출  유지")
    for md, total, high, mid, rate, cnt, conv, revenue, retained in rows:
        print(f"  {md}  {total:6,} {high:5,} {mid:5,}  {rate:5.2f}%  "
              f"{cnt:4,} {conv:5,}  {revenue:>9,}  {retained:4,}")
    print(f"\n  실행하면 INSERT: 최대 {len(rows)}행 (이미 있는 날짜는 ON CONFLICT 로 건너뜀)")
    print("  되돌리기: --undo (같은 범위만 삭제)")


def insert(conn, rows):
    cur = conn.cursor()
    cur.executemany(
        "INSERT INTO churn_daily_metric (metric_date, total_users, at_risk_high, at_risk_mid,"
        " churn_rate, intervention_count, conversion_count, attributed_revenue, retained_count)"
        " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (metric_date) DO NOTHING",
        rows,
    )
    conn.commit()
    print(f"백필 완료: {cur.rowcount}행 INSERT (기존 날짜는 건너뜀)")


def undo(conn, d_from, d_to):
    cur = conn.cursor()
    cur.execute("DELETE FROM churn_daily_metric WHERE metric_date BETWEEN %s AND %s", (d_from, d_to))
    conn.commit()
    print(f"되돌리기 완료: {cur.rowcount}행 삭제 ({d_from} ~ {d_to})")


def main():
    d_from, d_to = parse_range()
    conn = connect()
    try:
        if "--undo" in sys.argv:
            undo(conn, d_from, d_to)
        elif "--dry-run" in sys.argv:
            show(compute(conn, d_from, d_to), d_from, d_to)
        else:
            insert(conn, compute(conn, d_from, d_to))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
