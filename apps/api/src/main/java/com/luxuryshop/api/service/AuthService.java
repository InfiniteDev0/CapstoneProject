package com.luxuryshop.api.service;

import com.luxuryshop.api.dto.auth.AuthResponse;
import com.luxuryshop.api.dto.auth.LoginRequest;
import com.luxuryshop.api.dto.auth.RegisterRequest;
import com.luxuryshop.api.dto.user.UserResponse;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.entity.Role;
import com.luxuryshop.api.model.entity.User;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.security.JwtService;
import java.time.Instant;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The chef for sign-up and login.
 * @RequiredArgsConstructor (Lombok) writes a constructor for the final fields,
 * and Spring fills them in: that's "dependency injection", the chef gets handed his tools.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final DeviceService deviceService;

    @Transactional
    public AuthResponse register(RegisterRequest req, String userAgent, String deviceId) {
        String email = normalize(req.email());
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setName(req.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password())); // blend it: never store the plain password
        user.setRole(Role.CUSTOMER); // nobody can sign themselves up as admin
        user.setPhone(req.phone());
        user.setCountry(req.country());
        user.setCity(req.city());
        user.setGender(req.gender());
        user.setDateOfBirth(req.dateOfBirth());
        users.save(user);
        return startSession(user, userAgent, deviceId);
    }

    @Transactional
    public AuthResponse login(LoginRequest req, String userAgent, String deviceId) {
        // Same message for "no such email" and "wrong password": don't tell attackers which emails exist.
        User user = users.findByEmail(normalize(req.email()))
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!user.isActive()) {
            throw ApiException.forbidden("This account has been disabled");
        }
        return startSession(user, userAgent, deviceId);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return users.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    /** After a successful login or sign-up: note the time and device, then print the wristband. */
    private AuthResponse startSession(User user, String userAgent, String deviceId) {
        user.setLastLoginAt(Instant.now());
        users.save(user);
        deviceService.recordLogin(user.getId(), userAgent, deviceId);
        String token = jwtService.issue(user);
        return new AuthResponse(token, "Bearer", jwtService.lifetimeSeconds(), UserResponse.from(user));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
