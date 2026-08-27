package com.kopang.app.global.security;

import com.kopang.app.domain.user.UserDTO;
import com.kopang.app.domain.user.UserMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(JwtUtil jwtUtil, UserMapper userMapper) {
        this.jwtUtil = jwtUtil;
        this.userMapper = userMapper;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken authToken = (OAuth2AuthenticationToken) authentication;
        String registrationId = authToken.getAuthorizedClientRegistrationId();
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = "";

        if ("google".equals(registrationId)) {
            email = (String) attributes.get("email");
        } else if ("naver".equals(registrationId)) {
            Map<String, Object> naverResponse = (Map<String, Object>) attributes.get("response");
            if (naverResponse != null) {
                email = (String) naverResponse.get("email");
            }
        }

        // 동적으로 프론트엔드 URL 감지 (기본값이 localhost:5173 이더라도 EC2 IP/도메인에서 접속 시 해당 주소로 리다이렉트)
        String baseUrl = frontendUrl;
        String xForwardedHost = request.getHeader("X-Forwarded-Host");
        String hostHeader = request.getHeader("Host");
        String effectiveHost = (xForwardedHost != null && !xForwardedHost.isEmpty()) ? xForwardedHost : hostHeader;

        if (effectiveHost != null && !effectiveHost.contains("localhost") && !effectiveHost.contains("127.0.0.1")) {
            String scheme = request.getHeader("X-Forwarded-Proto");
            if (scheme == null || scheme.isEmpty()) {
                scheme = request.getScheme();
            }
            baseUrl = scheme + "://" + effectiveHost;
        }

        UserDTO user = userMapper.detailByEmail(email);
        if (user == null) {
            response.sendRedirect(baseUrl + "/login?error=user_not_found");
            return;
        }

        // KOPANG 자체 JWT 토큰 발급
        String accessToken = jwtUtil.generateAccessToken(user.getUserId(), user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        // 마지막 로그인 업데이트
        userMapper.updateLastLogin(user.getUserId());

        boolean hasPhone = user.getPhone() != null && !user.getPhone().trim().isEmpty();

        // React 프론트엔드의 OAuth 콜백 전용 화면으로 JWT를 실어서 리다이렉트 수행
        String targetUrl = UriComponentsBuilder.fromUriString(baseUrl + "/oauth2/callback")
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .queryParam("name", user.getName())
                .queryParam("email", user.getEmail())
                .queryParam("role", user.getRole())
                .queryParam("hasPhone", hasPhone)
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
