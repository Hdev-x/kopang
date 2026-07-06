package com.kopang.app.domain.user;

import com.kopang.app.global.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public UserDTO create(UserDTO request) {
        if (checkEmailDuplicate(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
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

        // 비밀번호를 수정하려는 경우 다시 암호화 처리
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
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
}
