package com.kopang.app.domain.user;

import com.kopang.app.global.security.JwtUtil;
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
            JavaMailSender mailSender) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mailSender = mailSender;
    }

    @Override
    public UserDTO create(UserDTO request) {
        if (checkEmailDuplicate(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
        }
        if (request.getPhone() != null && checkPhoneDuplicate(request.getPhone())) {
            throw new IllegalArgumentException("이미 등록된 전화번호입니다");
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
            // 발송 실패 시 콘솔 로그 출력 및 예외 전송 (실제 SMTP 키 등록 유도용 우회 제공)
            System.err.println("[EMAIL ERROR] Failed to send email to " + email + ": " + e.getMessage());
            verificationCache.put(email, new VerificationInfo("123456", System.currentTimeMillis() + 300000));
            throw new RuntimeException("이메일 발송에 실패했습니다. (메일 서버 설정 미비 또는 네트워크 오류)\n"
                    + "[개발 테스트용 우회 기능]: 구글/네이버 키 설정 전이므로, 테스트용 번호 '123456'을 입력하시면 즉시 비밀번호를 변경해 보실 수 있습니다.");
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
}
