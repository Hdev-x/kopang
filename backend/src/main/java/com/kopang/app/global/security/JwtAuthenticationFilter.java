package com.kopang.app.global.security;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null) {
            try {
                if (jwtUtil.validateToken(token)) {
                    String email = jwtUtil.getEmail(token);
                    String role = jwtUtil.getRole(token); // e.g., ROLE_USER, ROLE_ADMIN

                    if (email != null && role != null) {
                        // User principal holds email and role
                        CustomUserDetails userDetails = new CustomUserDetails(email, role);

                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, Collections.singletonList(new SimpleGrantedAuthority(role)));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } else {
                    // validateToken이 false이면 만료 여부를 판별하기 위해 파싱 시도 (만료 시 ExpiredJwtException 발생)
                    try {
                        jwtUtil.getEmail(token);
                    } catch (ExpiredJwtException e) {
                        sendExpiredTokenResponse(response);
                        return;
                    }
                }
            } catch (Exception e) {
                // 다른 JWT 오류는 그냥 인증되지 않은 상태로 진행시킴
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void sendExpiredTokenResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"success\":false,\"code\":\"TOKEN_EXPIRED\",\"message\":\"토큰이 만료되었습니다\"}");
    }

    // Custom Principal class to hold user details in SecurityContext
    public static class CustomUserDetails {
        private final String email;
        private final String role;

        public CustomUserDetails(String email, String role) {
            this.email = email;
            this.role = role;
        }

        public String getEmail() {
            return email;
        }

        public String getRole() {
            return role;
        }
    }
}
