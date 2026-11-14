package com.luxuryshop.api.exception;

import org.springframework.http.HttpStatus;

/**
 * The one shape every error has: { "error": "Not Found", "message": "...", "status": 404 }.
 * A "record" is a small read-only data class: Java writes the constructor and getters for us.
 */
public record ApiError(String error, String message, int status) {

    public static ApiError of(HttpStatus status, String message) {
        return new ApiError(status.getReasonPhrase(), message, status.value());
    }
}
