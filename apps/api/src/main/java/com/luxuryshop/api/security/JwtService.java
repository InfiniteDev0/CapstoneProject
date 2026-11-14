package com.luxuryshop.api.security;

import com.luxuryshop.api.config.JwtProperties;
import com.luxuryshop.api.model.entity.Role;
import com.luxuryshop.api.model.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

/**
 * The wristband printer and checker.
 * issue(): prints a wristband (JWT) saying "user 2, CUSTOMER", stamped with our secret key.
 * parse(): checks the stamp and expiry; a fake or expired wristband throws JwtException.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration lifetime;

    public JwtService(JwtProperties props) {
        if (props.secret() == null || props.secret().isBlank() || props.secret().startsWith("change-me")) {
            throw new IllegalStateException("JWT_SECRET is missing. Add it to the root .env (see .env.example).");
        }
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.secret()));
        this.lifetime = Duration.ofMinutes(props.expirationMinutes());
    }

    public String issue(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(lifetime)))
                .signWith(key)
                .compact();
    }

    public AuthUser parse(String token) throws JwtException {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return new AuthUser(
                Long.valueOf(claims.getSubject()),
                claims.get("email", String.class),
                Role.valueOf(claims.get("role", String.class)));
    }

    public long lifetimeSeconds() {
        return lifetime.toSeconds();
    }
}
