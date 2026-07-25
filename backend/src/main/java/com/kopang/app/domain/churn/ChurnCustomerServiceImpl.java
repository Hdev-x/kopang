package com.kopang.app.domain.churn;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChurnCustomerServiceImpl implements ChurnCustomerService {

    private final ChurnCustomerMapper customerMapper;

    @Override
    public RiskCustomerListResponse getRiskCustomers(
            String type, String memberType, String level, int page, int size) {
        int offset = page * size; // page(0부터) → 건너뛸 개수
        List<RiskCustomerResponse> content =
                customerMapper.findRiskCustomers(type, memberType, level, size, offset);
        long total = customerMapper.countRiskCustomers(type, memberType, level);
        return new RiskCustomerListResponse(content, total);
    }

    // 위험 고객 상세 — 4섹션 조회 후 조립. 없는 userId면 null(컨트롤러가 404)
    @Override
    public RiskCustomerDetailResponse getRiskCustomerDetail(long userId) {
        RiskCustomerDetailResponse.Profile profile = customerMapper.findCustomerProfile(userId);
        if (profile == null) {
            return null;
        }
        RiskCustomerDetailResponse detail = new RiskCustomerDetailResponse();
        detail.setProfile(profile);
        detail.setSignals(customerMapper.findSignalSummaries(userId));
        detail.setScoreHistory(customerMapper.findScoreHistory(userId, 20));
        detail.setInterventions(customerMapper.findCustomerInterventions(userId, 20));
        detail.setOrderSummary(customerMapper.findOrderSummary(userId));
        return detail;
    }
}
