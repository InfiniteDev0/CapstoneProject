package com.velanoire.api.dto.auth;

import com.velanoire.api.dto.user.UserResponse;

/** What you get after logging in: the wristband (token) and who you are. */
public record AuthResponse(String token, String tokenType, long expiresIn, UserResponse user) {
}
