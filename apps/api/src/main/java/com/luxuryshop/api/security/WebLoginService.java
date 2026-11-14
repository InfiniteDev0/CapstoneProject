package com.luxuryshop.api.security;

import com.luxuryshop.api.model.entity.Role;
import com.luxuryshop.api.model.entity.User;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.service.DeviceService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * The front-desk check for the web pages (shop and admin): is the password right,
 * is the account active, and (for the admin door) is this person a manager?
 * On success it notes the login time and device, just like the API login does.
 */
@Service
@RequiredArgsConstructor
public class WebLoginService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final DeviceService devices;

    /** Thrown when a customer tries the admin door. */
    public static class NotAnAdminException extends AuthenticationException {
        public NotAnAdminException() {
            super("This account doesn't have admin access. Please use the shop to sign in.");
        }
    }

    @Transactional
    public AuthUser login(String email, String password, boolean adminOnly) {
        // Same message for "no such email" and "wrong password": don't tell attackers which emails exist.
        User user = users.findByEmail(email == null ? "" : email.trim().toLowerCase(Locale.ROOT))
                .filter(u -> password != null && passwordEncoder.matches(password, u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!user.isActive()) {
            throw new DisabledException("This account has been disabled");
        }
        if (adminOnly && user.getRole() != Role.ADMIN) {
            throw new NotAnAdminException();
        }
        recordLogin(user);
        return new AuthUser(user.getId(), user.getEmail(), user.getRole());
    }

    /** Note the time and device of a login (also used right after sign-up). */
    @Transactional
    public void recordLogin(User user) {
        user.setLastLoginAt(Instant.now());
        users.save(user);
        HttpServletRequest request = RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes a
                ? a.getRequest() : null;
        if (request != null) {
            devices.recordLogin(user.getId(), request.getHeader(HttpHeaders.USER_AGENT), DeviceCookieFilter.deviceId(request));
        }
    }
}
