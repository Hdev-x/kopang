package com.kopang.app.domain.churn;

import java.time.LocalDate;

/** 대응 효과 리포트 서비스 */
public interface ChurnReportService {

    /** 대응 효과 리포트 (from/to null이면 전체 기간) */
    ChurnReportResponse getReport(LocalDate from, LocalDate to);
}
