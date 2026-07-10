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
