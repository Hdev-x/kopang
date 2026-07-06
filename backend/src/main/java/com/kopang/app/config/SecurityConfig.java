package com.kopang.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.kopang.app.global.security.JwtAuthenticationFilter;
import com.kopang.app.global.security.JwtUtil;

// SecurityConfig.java 수정안 예시
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private final JwtUtil jwtUtil;

	// JwtUtil 주입받기
	public SecurityConfig(JwtUtil jwtUtil) {
		this.jwtUtil = jwtUtil;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity security) throws Exception {
		security
				.cors(cors -> {
					cors.disable();
				})
				.csrf(csrf -> {
					csrf.disable();
				})
				.authorizeHttpRequests(auth -> {
					auth.anyRequest().permitAll();
				})
				// UsernamePasswordAuthenticationFilter 전에 JwtAuthenticationFilter 추가 👈
				.addFilterBefore(
						new JwtAuthenticationFilter(jwtUtil),
						org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

		return security.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
