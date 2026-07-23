package com.kopang.app.domain.satisfaction;

import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SatisfactionServiceImpl implements SatisfactionService {

    private final SatisfactionMapper satisfactionMapper;

    private static final Set<String> VALID_CONTEXTS = Set.of("ORDER", "CANCEL", "CS");

    @Override
    @Transactional
    public void submit(Long userId, SatisfactionRequest req) {
        // 입력 검증: score 1~5, context 화이트리스트
        if (req.getScore() == null || req.getScore() < 1 || req.getScore() > 5) {
            throw new IllegalArgumentException("만족도 점수는 1~5여야 합니다");
        }
        if (req.getContext() == null || !VALID_CONTEXTS.contains(req.getContext())) {
            throw new IllegalArgumentException("허용되지 않은 수집 지점입니다");
        }
        satisfactionMapper.insertSatisfaction(userId, req);
    }
}
