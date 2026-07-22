package com.kopang.app.domain.membership;

import com.kopang.app.domain.user.UserDTO;
import com.kopang.app.domain.user.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Calendar;
import java.util.Date;

@Service
@Transactional
public class MembershipServiceImpl implements MembershipService {

    private final MembershipMapper membershipMapper;
    private final UserMapper userMapper;
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${toss.secret-key}")
    private String tossSecretKey;

    public MembershipServiceImpl(MembershipMapper membershipMapper, UserMapper userMapper) {
        this.membershipMapper = membershipMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public UserMembershipDTO getActiveMembership(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }
        return membershipMapper.findActiveMembershipByUserId(user.getUserId());
    }

    @Override
    public UserMembershipDTO subscribe(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }

        UserMembershipDTO active = membershipMapper.findActiveMembershipByUserId(user.getUserId());
        if (active != null && ("ACTIVE".equals(active.getStatus()) || "CANCELLED".equals(active.getStatus()))) {
            throw new IllegalStateException("이미 이용 중이거나 해지 예약 상태인 WOW 멤버십이 존재합니다");
        }

        // 시작일: 현재 시각
        Date startDate = new Date();
        // 종료일: 시작일로부터 30일 뒤 설정
        Calendar cal = Calendar.getInstance();
        cal.setTime(startDate);
        cal.add(Calendar.DAY_OF_MONTH, 30);
        Date endDate = cal.getTime();

        UserMembershipDTO userMembership = UserMembershipDTO.builder()
                .userId(user.getUserId())
                .membershipId(1L) // 와우 멤버십 ID 고정 (테이블에 1번으로 인서트되어 있음)
                .startDate(startDate)
                .endDate(endDate)
                .status("ACTIVE")
                .cancelledAt(null)
                .build();

        membershipMapper.insertUserMembership(userMembership);
        return membershipMapper.findActiveMembershipByUserId(user.getUserId());
    }

    @Override
    public UserMembershipDTO subscribe(String email, String paymentKey, String orderId, int amount) {
        // 1. 결제 금액 무결성 검증 (구독료 4990원)
        if (amount != 4990) {
            throw new IllegalArgumentException("결제 요청 금액과 멤버십 요금이 일치하지 않습니다.");
        }

        // 2. 토스페이먼츠 승인 API 통신
        String url = "https://api.tosspayments.com/v1/payments/confirm";
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        String auth = java.util.Base64.getEncoder()
                .encodeToString((tossSecretKey + ":").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + auth);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("paymentKey", paymentKey);
        body.put("orderId", orderId);
        body.put("amount", amount);

        org.springframework.http.HttpEntity<java.util.Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(
                body, headers);
        try {
            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.postForEntity(url, entity,
                    java.util.Map.class);
            if (response.getStatusCode() != org.springframework.http.HttpStatus.OK) {
                throw new IllegalArgumentException("토스 결제 승인에 실패했습니다.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("결제 승인 통신 오류: " + e.getMessage());
        }

        // 3. 결제 승인 성공 시 실제 멤버십 데이터 생성 진행
        return subscribe(email);
    }

    @Override
    public void cancel(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }

        UserMembershipDTO active = membershipMapper.findActiveMembershipByUserId(user.getUserId());
        if (active == null || !"ACTIVE".equals(active.getStatus())) {
            throw new IllegalStateException("해지 예약할 수 있는 활성화된 WOW 멤버십이 없습니다");
        }

        membershipMapper.cancelUserMembership(active.getUserMembershipId(), new Date());
    }

    @Override
    public void keep(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }

        UserMembershipDTO active = membershipMapper.findActiveMembershipByUserId(user.getUserId());
        if (active == null || !"CANCELLED".equals(active.getStatus())) {
            throw new IllegalStateException("혜택 유지를 신청할 수 있는 해지 예약 멤버십이 없습니다");
        }

        membershipMapper.reactivateUserMembership(active.getUserMembershipId());
    }

    @Override
    @Transactional(readOnly = true)
    public int getSavedShippingFee(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }

        int paidOrdersCount = membershipMapper.countPaidOrdersLast30Days(user.getUserId());
        // 건당 3000원 배송비 절약 연산
        return paidOrdersCount * 3000;
    }
}
