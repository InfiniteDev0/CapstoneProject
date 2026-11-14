package com.luxuryshop.api.security;

import com.luxuryshop.api.model.entity.Role;
import java.io.Serializable;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * Who is logged in and their role. The same object for both kinds of login:
 * a JWT wristband (/api) or a web session (shop and admin pages).
 * Controllers receive it with @AuthenticationPrincipal AuthUser me.
 * Serializable because web sessions keep it.
 */
public record AuthUser(Long id, String email, Role role) implements Serializable {

    /** Spring Security checks roles as "ROLE_ADMIN" / "ROLE_CUSTOMER". */
    public List<GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
