package com.kopang.app.domain.churn;

import org.apache.ibatis.annotations.Mapper;

/**
 * 일별 이탈 지표(churn_daily_metric) 적재 전용 매퍼.
 * 조회는 ChurnDashboardMapper(읽기 전용)가 담당하고, 여기는 배치의 쓰기만 맡는다.
 */
@Mapper
public interface ChurnMetricMapper {

    /**
     * 최근 {@code days}일치 지표를 재집계해 upsert 한다.
     *
     * 오늘 1행만 쓰지 않는 이유: 전환은 대응 후 며칠 뒤에 발생하는데, 그때 오늘 행만
     * 갱신하면 그 전환이 어느 날짜에도 반영되지 않아 전환·매출 지표가 0으로 굳는다.
     * days 는 전환 창(7일)보다 넉넉해야 한다.
     *
     * @return 반영된 행 수
     */
    int upsertRecentMetrics(@org.apache.ibatis.annotations.Param("days") int days);
}
