package com.luxuryshop.api.dto.cart;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** "Add to bag". selectedSize must be one of the product's sizes (S, M, L, 9, 10...); leave it out for one-size items. */
public record AddToCartRequest(
        @NotBlank @Pattern(regexp = "^[0-9a-fA-F]{24}$", message = "must be a product id (24 hex characters)") String productId,
        @NotBlank @Size(max = 40) String sku,
        @NotNull @Min(1) @Max(20) Integer quantity,
        @Size(max = 10) String selectedSize,
        @Size(max = 500) String comments) {
}
