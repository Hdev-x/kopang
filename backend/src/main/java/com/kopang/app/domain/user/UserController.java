package com.kopang.app.domain.user;

import com.kopang.app.global.common.ApiResponse;
import com.kopang.app.global.security.JwtAuthenticationFilter.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 1. 회원가입 (POST /api/auth/signup)
    @PostMapping("/auth/signup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> signup(@RequestBody UserDTO request) {
        try {
            UserDTO registeredUser = userService.create(request);

            Map<String, Object> data = new HashMap<>();
            data.put("id", registeredUser.getUserId());
            data.put("email", registeredUser.getEmail());
            data.put("name", registeredUser.getName());

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 2. 로그인 (POST /api/auth/login)
    @PostMapping("/auth/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody UserDTO request) {
        try {
            UserDTO user = userService.login(request);

            // 프론트엔드가 요구하는 중첩 구조 동적 조립
            Map<String, Object> data = new HashMap<>();
            data.put("accessToken", user.getAccessToken());
            data.put("refreshToken", user.getRefreshToken());

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getUserId());
            userInfo.put("name", user.getName());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            data.put("user", userInfo);

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 3. 토큰 재발급 (POST /api/auth/refresh)
    @PostMapping("/auth/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refresh(@RequestBody Map<String, String> body) {
        try {
            String refreshToken = body.get("refreshToken");
            UserDTO user = userService.refresh(refreshToken);

            // 프론트엔드가 요구하는 중첩 구조 동적 조립
            Map<String, Object> data = new HashMap<>();
            data.put("accessToken", user.getAccessToken());
            data.put("refreshToken", user.getRefreshToken());

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getUserId());
            userInfo.put("name", user.getName());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            data.put("user", userInfo);

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("TOKEN_INVALID", e.getMessage()));
        }
    }

    // 4. 이메일 중복 체크 (GET /api/auth/check-email)
    @GetMapping("/auth/check-email")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkEmail(@RequestParam("email") String email) {
        boolean exists = userService.checkEmailDuplicate(email);
        Map<String, Boolean> data = new HashMap<>();
        data.put("exists", exists);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // 5. 내 정보 조회 (GET /api/users/me)
    @GetMapping("/users/me")
    public ResponseEntity<ApiResponse<UserDTO>> getMyInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            UserDTO user = userService.detailByEmail(userDetails.getEmail());
            // 비밀번호는 보안상 누출 방지
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 6. 회원 정보 수정 (PUT /api/users/me)
    @PutMapping("/users/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UserDTO request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            userService.update(userDetails.getEmail(), request);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "회원 정보가 성공적으로 수정되었습니다");

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 7. 회원 탈퇴 (DELETE /api/users/me)
    @DeleteMapping("/users/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> delete(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.fail("인증되지 않은 사용자입니다"));
        }
        try {
            userService.delete(userDetails.getEmail());

            Map<String, Object> data = new HashMap<>();
            data.put("message", "회원 탈퇴가 완료되었습니다");

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 8. 비밀번호 찾기 - 인증코드 발송 (POST /api/auth/find-password/send-code)
    @PostMapping("/auth/find-password/send-code")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendVerificationCode(
            @RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            userService.sendVerificationCode(email);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "인증번호가 발송되었습니다. (테스트용 인증번호: 123456)");

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    // 9. 비밀번호 찾기 - 비밀번호 재설정 (POST /api/auth/find-password/reset)
    @PostMapping("/auth/find-password/reset")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String code = body.get("code");
            String newPassword = body.get("newPassword");

            userService.resetPassword(email, code, newPassword);

            Map<String, Object> data = new HashMap<>();
            data.put("message", "비밀번호가 성공적으로 재설정되었습니다");

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
