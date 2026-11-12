package com.velanoire.api.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * The bouncer at the door. Runs before every request:
 * if the request carries "Authorization: Bearer <wristband>" and the wristband is genuine,
 * it tells Spring Security who this is. If there is no wristband (or a bad one), the
 * request continues as a guest; SecurityConfig then decides if guests may enter that room.
 *
 * Not a @Component on purpose: SecurityConfig creates it, so it runs exactly once,
 * inside the security chain.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFIX = "Bearer ";
    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(PREFIX)) {
            try {
                AuthUser user = jwtService.parse(header.substring(PREFIX.length()).trim());
                var authentication = new UsernamePasswordAuthenticationToken(user, null, user.authorities());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException e) {
                SecurityContextHolder.clearContext(); // fake or expired: treat as a guest
            }
        }
        chain.doFilter(request, response);
    }
}
