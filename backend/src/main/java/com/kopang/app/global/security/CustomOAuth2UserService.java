package com.kopang.app.global.security;

import com.kopang.app.domain.user.UserDTO;
import com.kopang.app.domain.user.UserMapper;
import com.kopang.app.domain.user.UserService;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    public CustomOAuth2UserService(UserMapper userMapper, PasswordEncoder passwordEncoder, UserService userService) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // 서비스 ID 구분 (google, naver 등)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // OAuth2 로그인 진행 시 키가 되는 필드값 (PK)
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = "";
        String name = "";
        String phone = "";

        if ("google".equals(registrationId)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
        } else if ("naver".equals(registrationId)) {
            Map<String, Object> response = (Map<String, Object>) attributes.get("response");
            if (response != null) {
                email = (String) response.get("email");
                name = (String) response.get("name");
                phone = (String) response.get("mobile"); // 네이버 연락처 (포맷: 010-XXXX-XXXX)
            }
        }

        if (email == null || email.isEmpty()) {
            throw new OAuth2AuthenticationException("OAuth2 공급자로부터 이메일 정보를 불러올 수 없습니다.");
        }

        // DB 확인 후 자동 가입 처리
        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            // 신규 유저 생성 (소셜 로그인 가입)
            user = UserDTO.builder()
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // 임의의 랜덤 비밀번호
                    .name(name != null ? name : "소셜회원")
                    .phone(phone != null ? phone : "")
                    .role("USER")
                    .status("ACTIVE")
                    .build();
            userMapper.create(user);

            // 소셜 가입 완료 즉시 웰컴 혜택 자동 지급 (3000P & 10% 쿠폰)
            userService.giveWelcomeBenefits(user.getUserId());
        } else {
            // 기존 유저인 경우 정보 업데이트
            boolean updated = false;
            if (name != null && !name.equals(user.getName())) {
                user.setName(name);
                updated = true;
            }
            if (phone != null && !phone.trim().isEmpty()
                    && (user.getPhone() == null || user.getPhone().trim().isEmpty())) {
                user.setPhone(phone);
                updated = true;
            }
            if (updated) {
                userMapper.update(user);
            }
        }

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole())),
                attributes,
                userNameAttributeName);
    }
}
