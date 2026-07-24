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
}
