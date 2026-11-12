package com.velanoire.api.security;

import com.velanoire.api.model.entity.Role;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * What the wristband says: who you are and your role.
 * Controllers receive it with @AuthenticationPrincipal AuthUser me.
 */
public record AuthUser(Long id, String email, Role role) {

    /** Spring Security checks roles as "ROLE_ADMIN" / "ROLE_CUSTOMER". */
    public List<GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
