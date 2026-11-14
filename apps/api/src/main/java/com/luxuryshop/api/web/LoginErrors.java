package com.luxuryshop.api.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.WebAttributes;

/** The message Spring Security left after a failed login, e.g. "Invalid email or password". */
public final class LoginErrors {

    private LoginErrors() {
    }

    public static String last(HttpServletRequest request) {
        if (request.getParameter("error") == null) return null;
        var session = request.getSession(false);
        Object e = session == null ? null : session.getAttribute(WebAttributes.AUTHENTICATION_EXCEPTION);
        return e instanceof AuthenticationException ae ? ae.getMessage() : "Invalid email or password";
    }
}
