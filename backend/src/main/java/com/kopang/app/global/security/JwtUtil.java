package com.kopang.app.global.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long accessTokenValidity;
    private final long refreshTokenValidity;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-validity-ms}") long accessTokenValidity,
            @Value("${jwt.refresh-token-validity-ms}") long refreshTokenValidity) {
        // 설정 파일에 텍스트로 적힌 암호화 키를 컴퓨터가 인식할 수 있는 데이터로 변환
        // 일반 문자열로는 암호화 작업을 할 수 없어 라이브러리가 인식할 수 있는 전용 Key 객체로 변환해서 this.secretKey 필드에 보관
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValidity = accessTokenValidity;
        this.refreshTokenValidity = refreshTokenValidity;
    }

    // Access Token 생성
    public String generateAccessToken(String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, email, accessTokenValidity);
    }

    // Refresh Token 생성
    public String generateRefreshToken(String email) {
        return createToken(new HashMap<>(), email, refreshTokenValidity);
    }

    // 토큰 실제 생성 로직
    private String createToken(Map<String, Object> claims, String subject, long validityMs) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityMs);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey)
                .compact();
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 토큰에서 이메일(Subject) 추출
    public String getEmail(String token) {
        return getClaims(token).getSubject();
    }

    // 토큰에서 권한(Role) 추출
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // Claims 파싱
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
