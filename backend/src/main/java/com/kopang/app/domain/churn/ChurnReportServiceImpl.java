package com.kopang.app.domain.churn;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnReportServiceImpl implements ChurnReportService {

    private final ChurnReportMapper reportMapper;

    @Override
    public ChurnReportResponse getReport(LocalDate from, LocalDate to) {
        ChurnReportResponse res = new ChurnReportResponse();
        res.setKpi(reportMapper.selectKpi(from, to));
        res.setEffect(reportMapper.selectEffect(from, to));
        return res;
    }
}
