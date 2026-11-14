package com.luxuryshop.api.dto.event;

import com.luxuryshop.api.model.document.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * One click from the shop. sessionId is a random id the browser keeps for the visit.
 * device is optional (worked out from the User-Agent if left out).
 */
public record EventRequest(
        @NotNull EventType type,
        @NotBlank @Size(max = 64) String sessionId,
        @Pattern(regexp = "^[0-9a-fA-F]{24}$", message = "must be a product id (24 hex characters)") String productId,
        @Size(max = 40) String category,
        @Size(max = 200) String query,
        @Size(max = 300) String page,
        @Pattern(regexp = "DESKTOP|MOBILE|TABLET") String device) {
}
