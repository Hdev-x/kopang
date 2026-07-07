package com.kopang.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.kopang.app.global.security.CustomOAuth2UserService;
import com.kopang.app.global.security.JwtAuthenticationFilter;
import com.kopang.app.global.security.JwtUtil;
import com.kopang.app.global.security.OAuth2AuthenticationSuccessHandler;

// SecurityConfig.java 수정안 예시
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private final JwtUtil jwtUtil;

	private final CustomOAuth2UserService customOAuth2UserService;
	private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

	public SecurityConfig(JwtUtil jwtUtil,
			CustomOAuth2UserService customOAuth2UserService,
			OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler) {
		this.jwtUtil = jwtUtil;
		this.customOAuth2UserService = customOAuth2UserService;
		this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity security) throws Exception {
		security
				.cors(cors -> cors.disable())
				.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
				.addFilterBefore(new JwtAuthenticationFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)

				// 💡 아래와 같이 OAuth2 로그인 설정을 연동해주어야 404 에러가 발생하지 않습니다.
				.oauth2Login(oauth2 -> oauth2
						.userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
						.successHandler(oAuth2AuthenticationSuccessHandler));
		return security.build();
	}
}
