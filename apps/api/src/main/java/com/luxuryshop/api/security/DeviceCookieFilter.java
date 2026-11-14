package com.luxuryshop.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.UUID;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Gives every browser a stable, random device id in a cookie (ls_device), the web-page
 * version of the X-Device-Id header the API uses. It lets the profile show "2 devices"
 * and lets the churn model count devices. It holds no personal data.
 * Runs before Spring Security, so the login check can read it.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class DeviceCookieFilter extends OncePerRequestFilter {

    public static final String COOKIE = "ls_device";
    private static final String ATTRIBUTE = DeviceCookieFilter.class.getName();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/") || path.startsWith("/css/") || path.startsWith("/js/")
                || path.startsWith("/fonts/") || path.startsWith("/img/") || path.startsWith("/uploads/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String id = fromCookie(request);
        if (id == null) {
            id = UUID.randomUUID().toString();
            ResponseCookie cookie = ResponseCookie.from(COOKIE, id)
                    .path("/").httpOnly(true).sameSite("Lax").maxAge(Duration.ofDays(730)).build();
            response.addHeader("Set-Cookie", cookie.toString());
        }
        request.setAttribute(ATTRIBUTE, id);
        chain.doFilter(request, response);
    }

    /** This browser's device id (or null outside a web request). */
    public static String deviceId(HttpServletRequest request) {
        Object fromFilter = request.getAttribute(ATTRIBUTE);
        return fromFilter != null ? fromFilter.toString() : fromCookie(request);
    }

    private static String fromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (COOKIE.equals(c.getName()) && c.getValue() != null && c.getValue().matches("[0-9a-f-]{36}")) {
                return c.getValue();
            }
        }
        return null;
    }
}
