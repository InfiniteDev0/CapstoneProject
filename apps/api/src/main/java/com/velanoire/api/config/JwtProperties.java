package com.velanoire.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Reads app.jwt.* from application.properties (which reads JWT_SECRET from .env). */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, long expirationMinutes) {
}
