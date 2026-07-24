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

    // 사유 화이트리스트 (2026-07-24 회의: 별점 입력 시 사유 수집)
    private static final Set<String> VALID_REASONS =
            Set.of("DELIVERY", "QUALITY", "PRICE", "SERVICE", "ETC");

    // 노출 주기: 회원당 3개월(90일) 1회
    private static final int COOLDOWN_DAYS = 90;

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
        // 사유는 선택 — 값이 있으면 화이트리스트 검증
        if (req.getReason() != null && !VALID_REASONS.contains(req.getReason())) {
            throw new IllegalArgumentException("허용되지 않은 사유입니다");
        }
        satisfactionMapper.insertSatisfaction(userId, req);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEligible(Long userId) {
        return satisfactionMapper.countRecentByUserId(userId, COOLDOWN_DAYS) == 0;
    }
}
