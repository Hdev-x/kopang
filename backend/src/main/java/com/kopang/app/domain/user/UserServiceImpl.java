package com.kopang.app.domain.user;

import com.kopang.app.global.security.JwtUtil;
import com.kopang.app.domain.point.PointMapper;
import com.kopang.app.domain.point.PointHistoryDTO;
import com.kopang.app.domain.coupon.CouponMapper;
import com.kopang.app.domain.coupon.CouponDTO;
import com.kopang.app.domain.coupon.UserCouponDTO;
import com.kopang.app.domain.notification.NotificationMapper;
import com.kopang.app.domain.notification.NotificationDTO;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;
    private final PointMapper pointMapper;
    private final CouponMapper couponMapper;
    private final NotificationMapper notificationMapper;

    // 인증 유효시간 정보 관리 캐시
    private final java.util.Map<String, VerificationInfo> verificationCache = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.security.SecureRandom random = new java.security.SecureRandom();

    private static class VerificationInfo {
        private final String code;
        private final long expiryTime;

        public VerificationInfo(String code, long expiryTime) {
            this.code = code;
            this.expiryTime = expiryTime;
        }

        public String getCode() {
            return code;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }

    public UserServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
            JavaMailSender mailSender, PointMapper pointMapper, CouponMapper couponMapper,
            NotificationMapper notificationMapper) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mailSender = mailSender;
        this.pointMapper = pointMapper;
        this.couponMapper = couponMapper;
        this.notificationMapper = notificationMapper;
    }

    @Override
    public UserDTO create(UserDTO request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해 주세요.");
        }
        if (!request.getEmail().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
        }
        if (checkEmailDuplicate(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
        }

        // 1. 이름 검증
        if (request.getName() == null || request.getName().trim().isEmpty() || request.getName().length() > 50) {
            throw new IllegalArgumentException("이름은 1자 이상 50자 이하로 입력해 주세요.");
        }

        // 2. 연락처 검증
        if (request.getPhone() == null || !request.getPhone().matches("^01[016789]-\\d{3,4}-\\d{4}$")) {
            throw new IllegalArgumentException("올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)");
        }
        if (checkPhoneDuplicate(request.getPhone())) {
            throw new IllegalArgumentException("이미 있는 회원입니다");
        }

        // 3. 비밀번호 검증
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new IllegalArgumentException("비밀번호는 최소 8자 이상이어야 합니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        UserDTO user = UserDTO.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .name(request.getName())
                .phone(request.getPhone())
                .birthDate(request.getBirthDate())
                .role("USER") // 기본 회원 권한
                .status("ACTIVE")
                .build();

        userMapper.create(user);

        // 가입 완료 즉시 웰컴 혜택 자동 지급 (3000P & 10% 쿠폰)
        giveWelcomeBenefits(user.getUserId());

        return user;
    }

    @Override
    public UserDTO login(UserDTO request) {
        UserDTO user = userMapper.detailByEmail(request.getEmail());
        if (user == null) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다");
        }

        // 로그인 시간 업데이트
        userMapper.updateLastLogin(user.getUserId());

        // JWT 토큰 발급 후 DTO 필드에 직접 보관
        user.setAccessToken(jwtUtil.generateAccessToken(user.getEmail(), user.getRole()));
        user.setRefreshToken(jwtUtil.generateRefreshToken(user.getEmail()));

        // 보안상 패스워드 제거 후 리턴
        user.setPassword(null);
        return user;
    }

    @Override
    public UserDTO refresh(String refreshToken) {
        if (refreshToken == null || !jwtUtil.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 Refresh Token입니다");
        }

        String email = jwtUtil.getEmail(refreshToken);
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("존재하지 않는 회원입니다");
        }

        // 새 토큰 생성 후 DTO 필드에 직접 보관
        user.setAccessToken(jwtUtil.generateAccessToken(user.getEmail(), user.getRole()));
        user.setRefreshToken(jwtUtil.generateRefreshToken(user.getEmail()));

        // 보안상 패스워드 제거 후 리턴
        user.setPassword(null);
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkEmailDuplicate(String email) {
        return userMapper.detailByEmail(email) != null;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO detail(Long userId) {
        UserDTO user = userMapper.detail(userId);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO detailByEmail(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("회원을 찾을 수 없습니다");
        }
        return user;
    }

    @Override
    public void update(String email, UserDTO request) {
        UserDTO existingUser = userMapper.detailByEmail(email);
        if (existingUser == null) {
            throw new IllegalArgumentException("수정할 회원을 찾을 수 없습니다");
        }

        // 1. 이름 검증
        if (request.getName() != null) {
            if (request.getName().trim().isEmpty() || request.getName().length() > 50) {
                throw new IllegalArgumentException("이름은 1자 이상 50자 이하로 입력해 주세요.");
            }
        }

        // 2. 연락처 검증
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            if (!request.getPhone().matches("^01[016789]-\\d{3,4}-\\d{4}$")) {
                throw new IllegalArgumentException("올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)");
            }
        }

        // 3. 생년월일 검증
        if (request.getBirthDate() != null && !request.getBirthDate().isEmpty()) {
            try {
                java.time.LocalDate birth = java.time.LocalDate.parse(request.getBirthDate());
                if (birth.isAfter(java.time.LocalDate.now())) {
                    throw new IllegalArgumentException("생년월일은 미래 날짜일 수 없습니다.");
                }
                if (birth.isBefore(java.time.LocalDate.of(1900, 1, 1))) {
                    throw new IllegalArgumentException("올바른 생년월일을 입력해 주세요. (1900년 이후)");
                }
            } catch (java.time.format.DateTimeParseException e) {
                throw new IllegalArgumentException("올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)");
            }
        }

        // 4. 비밀번호 검증
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            if (request.getPassword().length() < 8) {
                throw new IllegalArgumentException("비밀번호는 최소 8자 이상이어야 합니다.");
            }
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // 변경하고자 하는 값만 동적으로 업데이트 세팅
        if (request.getName() != null) {
            existingUser.setName(request.getName());
        }
        if (request.getPhone() != null) {
            existingUser.setPhone(request.getPhone());
        }
        if (request.getBirthDate() != null) {
            existingUser.setBirthDate(request.getBirthDate());
        }

        userMapper.update(existingUser);
    }

    @Override
    public void delete(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("탈퇴 처리할 회원을 찾을 수 없습니다");
        }
        userMapper.delete(user.getUserId());
    }

    @Override
    @Transactional(readOnly = true)
    public void sendVerificationCode(String email) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다");
        }

        // 6자리 무작위 인증코드 생성
        int codeVal = 100000 + random.nextInt(900000);
        String code = String.valueOf(codeVal);

        // 유효기간 5분 (300000ms) 설정 후 캐싱
        long expiryTime = System.currentTimeMillis() + 300000;
        verificationCache.put(email, new VerificationInfo(code, expiryTime));

        // 메일 발송
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("[Kopang] 비밀번호 찾기 인증번호 안내");

            String htmlContent = "<div style=\"font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 450px; margin: 20px auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.06);\">"
                    + "  <div style=\"text-align: center; margin-bottom: 25px;\">"
                    + "    <h1 style=\"color: #4a90e2; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -1px;\">KOPANG</h1>"
                    + "  </div>"
                    + "  <div style=\"color: #333333; font-size: 15px; line-height: 1.6; margin-bottom: 25px;\">"
                    + "    <p style=\"margin-top: 0;\">안녕하세요. <strong>코팡(KOPANG)</strong>입니다.</p>"
                    + "    <p>비밀번호 재설정을 위해 아래의 6자리 인증번호를 입력해 주세요.</p>"
                    + "  </div>"
                    + "  <div style=\"background-color: #f5f9ff; border: 1px dashed #4a90e2; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 25px;\">"
                    + "    <span style=\"font-size: 32px; font-weight: bold; color: #4a90e2; letter-spacing: 6px; display: inline-block; padding-left: 6px;\">"
                    + code + "</span>"
                    + "  </div>"
                    + "  <div style=\"color: #777777; font-size: 13px; line-height: 1.6; border-top: 1px solid #eaeaea; padding-top: 20px;\">"
                    + "    <p style=\"margin: 0 0 5px 0;\">• 본 인증번호의 유효기간은 <strong>5분</strong>입니다.</p>"
                    + "    <p style=\"margin: 0 0 5px 0;\">• 본인이 요청하지 않은 경우, 이 메일을 무시해 주세요.</p>"
                    + "    <p style=\"margin: 0;\">감사합니다.</p>"
                    + "  </div>"
                    + "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            System.out.println("[EMAIL SUCCESS] Verification code sent to " + email);
        } catch (Exception e) {
            System.err.println("[EMAIL ERROR] Failed to send email to " + email + ": " + e.getMessage());
            throw new RuntimeException("이메일 발송에 실패했습니다. 메일 서버 설정 및 이메일 주소를 확인해 주세요.");
        }
    }

    @Override
    public void resetPassword(String email, String code, String newPassword) {
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다");
        }

        VerificationInfo info = verificationCache.get(email);
        if (info == null) {
            throw new IllegalArgumentException("인증번호를 발송한 기록이 없습니다");
        }

        if (info.isExpired()) {
            verificationCache.remove(email);
            throw new IllegalArgumentException("인증번호 유효기간이 초과되었습니다. 다시 발송해 주세요");
        }

        if (!info.getCode().equals(code)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 최소 8자 이상이어야 합니다.");
        }

        // 검증 완료 후 캐시 삭제
        verificationCache.remove(email);

        // 새 비밀번호 암호화 후 업데이트
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.update(user);
    }

    @Override
    @Transactional(readOnly = true)
    public String findEmailByNameAndPhone(String name, String phone) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("이름을 입력해 주세요.");
        }
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("연락처를 입력해 주세요.");
        }

        UserDTO user = userMapper.findByNameAndPhone(name.trim(), phone.trim());
        if (user == null) {
            throw new IllegalArgumentException("입력하신 정보와 일치하는 회원이 존재하지 않습니다.");
        }
        return user.getEmail();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkPhoneDuplicate(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        return userMapper.findByPhone(phone.trim()) != null;
    }

    @Override
    @Transactional
    public void giveWelcomeBenefits(Long userId) {
        try {
            // 1. 3000P 적립금 지급
            PointHistoryDTO pointHistory = PointHistoryDTO.builder()
                    .userId(userId)
                    .amount(3000)
                    .type("WELCOME")
                    .description("신규 회원 가입 포인트 지급")
                    .build();
            pointMapper.insertPointHistory(pointHistory);

            // 2. 신규가입 10% 쿠폰 (ID 1) 발급
            Long welcomeCouponId = 1L;
            int existingCoupon = couponMapper.countUserCouponByCouponId(userId, welcomeCouponId);
            if (existingCoupon == 0) {
                CouponDTO coupon = couponMapper.findCouponById(welcomeCouponId);
                if (coupon != null && coupon.getQuantity() > 0) {
                    couponMapper.decreaseCouponQuantity(welcomeCouponId);

                    // 쿠폰 만료일 계산 (발급일로부터 30일 설정, 최대 쿠폰 만료일 내)
                    java.util.Calendar cal = java.util.Calendar.getInstance();
                    cal.add(java.util.Calendar.DAY_OF_MONTH, 30);
                    java.util.Date expiresAt = cal.getTime();
                    if (coupon.getEndDate() != null && coupon.getEndDate().before(expiresAt)) {
                        expiresAt = coupon.getEndDate();
                    }

                    UserCouponDTO userCoupon = UserCouponDTO.builder()
                            .userId(userId)
                            .couponId(welcomeCouponId)
                            .used(false)
                            .issuedAt(new java.util.Date())
                            .expiresAt(expiresAt)
                            .build();
                    couponMapper.insertUserCoupon(userCoupon);
                }
            }

            // 3. 인앱 웰컴 알림 발송
            NotificationDTO welcomeNotification = NotificationDTO.builder()
                    .userId(userId)
                    .type("WELCOME_BACK")
                    .message("회원가입을 환영합니다! 웰컴 3,000P 적립금과 10% 신규 가입 쿠폰이 지급되었습니다. 지금 혜택을 확인해 보세요!")
                    .refId(null)
                    .isRead(false)
                    .clicked(false)
                    .build();
            notificationMapper.insertNotification(welcomeNotification);
        } catch (Exception e) {
            // 웰컴 혜택 지급 오류 시 로그 출력 후 가입 진행 자체는 정상 완료하도록 처리
            System.err.println("[웰컴 혜택 지급 오류] userId: " + userId + " - " + e.getMessage());
        }
    }
}
