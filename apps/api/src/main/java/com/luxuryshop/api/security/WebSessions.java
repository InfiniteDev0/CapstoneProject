package com.luxuryshop.api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;

/**
 * The two web doors keep their logins in the same browser session but under DIFFERENT
 * keys, like two separate wristbands: signing in to the shop never signs you in to the
 * admin, and signing out of one leaves the other alone.
 */
public final class WebSessions {

    public static final String SHOP_KEY = "LS_SHOP_LOGIN";
    public static final String ADMIN_KEY = "LS_ADMIN_LOGIN";

    private WebSessions() {
    }

    public static HttpSessionSecurityContextRepository repository(String key) {
        HttpSessionSecurityContextRepository repo = new HttpSessionSecurityContextRepository();
        repo.setSpringSecurityContextKey(key);
        return repo;
    }

    /** Where each door remembers "the page you wanted before we asked you to sign in". */
    public static HttpSessionRequestCache requestCache(String key) {
        HttpSessionRequestCache cache = new HttpSessionRequestCache();
        cache.setSessionAttrName(key + "_SAVED_REQUEST");
        cache.setMatchingRequestParameterName(null); // no "?continue" on the URL
        return cache;
    }

    /** Sign someone in to the shop right away (used after sign-up). */
    public static void signInToShop(AuthUser user, HttpServletRequest request, HttpServletResponse response) {
        request.getSession(true);
        request.changeSessionId(); // a fresh session id after login (stops session fixation)
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user, null, user.authorities()));
        SecurityContextHolder.setContext(context);
        repository(SHOP_KEY).saveContext(context, request, response);
    }
}
