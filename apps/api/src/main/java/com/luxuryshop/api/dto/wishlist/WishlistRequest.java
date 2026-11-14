package com.luxuryshop.api.dto.wishlist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record WishlistRequest(
        @NotBlank @Pattern(regexp = "^[0-9a-fA-F]{24}$", message = "must be a product id (24 hex characters)") String productId) {
}
