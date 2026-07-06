package com.kopang.app.domain.user;

public interface UserService {
    // 1. Create (회원 가입)
    UserDTO create(UserDTO request);

    // 2. Read (상세 정보 조회)
    UserDTO detail(Long userId);

    UserDTO detailByEmail(String email);

    // 3. Update (회원 정보 수정)
    void update(String email, UserDTO request);

    // 4. Delete (회원 탈퇴)
    void delete(String email);

    // 로그인 및 토큰 갱신
    UserDTO login(UserDTO request);

    UserDTO refresh(String refreshToken);

    // 이메일 중복 체크
    boolean checkEmailDuplicate(String email);
}
