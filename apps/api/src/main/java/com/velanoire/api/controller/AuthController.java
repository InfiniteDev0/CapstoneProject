package com.velanoire.api.controller;

import com.velanoire.api.dto.auth.AuthResponse;
import com.velanoire.api.dto.auth.LoginRequest;
import com.velanoire.api.dto.auth.RegisterRequest;
import com.velanoire.api.dto.user.UserResponse;
import com.velanoire.api.security.AuthUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.velanoire.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

/**
 * The waiter at the front door. Takes the ticket, hands it to the chef (AuthService),
 * brings back the plate (JSON). No business logic lives here.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "1. Auth", description = "Sign up, log in, who am I")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirements // open to everyone: no lock icon in Swagger
    @Operation(summary = "Create a customer account and get a token")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId) {
        return authService.register(request, userAgent, deviceId);
    }

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(summary = "Log in and get a token (the wristband)")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId) {
        return authService.login(request, userAgent, deviceId);
    }

    @GetMapping("/me")
    @Operation(summary = "Who am I? (needs a token)")
    public UserResponse me(@AuthenticationPrincipal AuthUser me) {
        return authService.me(me.id());
    }
}
