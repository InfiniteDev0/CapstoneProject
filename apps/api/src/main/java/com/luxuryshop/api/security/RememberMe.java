package com.luxuryshop.api.security;

import com.luxuryshop.api.model.entity.Role;
import com.luxuryshop.api.model.entity.User;
import com.luxuryshop.api.repository.jpa.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Locale;
import org.springframework.security.authentication.RememberMeAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;

/**
 * "Remember me": a signed cookie that logs you back in after the browser closes or the
 * server restarts (sessions only live in the server's memory). The signature mixes the
 * email, the expiry, the password hash and our secret, so changing the password or the
 * secret cancels every remembered login.
 *
 * The shop and the admin each get their own cookie; the admin one only works for admins.
 */
public final class RememberMe {

    private RememberMe() {
    }

    public static Services shop(String secret, UserRepository users) {
        Services s = new Services(secret + ":shop", loader(users, false), users);
        s.setCookieName("LS_REMEMBER");
        s.setTokenValiditySeconds(60 * 60 * 24 * 30); // 30 days
        s.setParameter("remember");
        return s;
    }

    public static Services admin(String secret, UserRepository users) {
        Services s = new Services(secret + ":admin", loader(users, true), users);
        s.setCookieName("LS_ADMIN_REMEMBER");
        s.setTokenValiditySeconds(60 * 60 * 24 * 7); // 7 days
        s.setParameter("remember");
        return s;
    }

    /** Looks people up by email for the cookie check (only active accounts; admins only for the admin cookie). */
    private static UserDetailsService loader(UserRepository users, boolean adminOnly) {
        return email -> {
            User u = users.findByEmail(email.toLowerCase(Locale.ROOT))
                    .filter(User::isActive)
                    .filter(x -> !adminOnly || x.getRole() == Role.ADMIN)
                    .orElseThrow(() -> new UsernameNotFoundException("No such account"));
            return org.springframework.security.core.userdetails.User.withUsername(u.getEmail())
                    .password(u.getPasswordHash()).roles(u.getRole().name()).build();
        };
    }

    /** Spring's cookie service, adjusted so the logged-in person is our usual AuthUser. */
    public static final class Services extends TokenBasedRememberMeServices {
        private final UserRepository users;

        Services(String key, UserDetailsService loader, UserRepository users) {
            super(key, loader);
            this.users = users;
        }

        /** The cookie is made right after a form login, whose principal is an AuthUser. */
        @Override
        protected String retrieveUserName(Authentication login) {
            return login.getPrincipal() instanceof AuthUser me ? me.email() : super.retrieveUserName(login);
        }

        /** Coming back with a valid cookie: sign in as the same AuthUser a form login gives. */
        @Override
        protected Authentication createSuccessfulAuthentication(HttpServletRequest request, UserDetails details) {
            User u = users.findByEmail(details.getUsername()).orElseThrow(() -> new UsernameNotFoundException("No such account"));
            AuthUser me = new AuthUser(u.getId(), u.getEmail(), u.getRole());
            List<SimpleGrantedAuthority> roles = List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name()));
            RememberMeAuthenticationToken auth = new RememberMeAuthenticationToken(getKey(), me, roles);
            auth.setDetails(getAuthenticationDetailsSource().buildDetails(request));
            return auth;
        }
    }
}
