package com.kopang.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

     //인증과 인가에 대한 설정
	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity security) throws Exception{
		security
			.cors(cors->{cors.disable();})
			.csrf(csrf->{csrf.disable();})
			.authorizeHttpRequests(auth->{ //인가에 대한 설정(권한설정)
				auth
				.anyRequest().permitAll()
				;
			});
			
		return security.build();
	}


}
