package com.luxuryshop.api.dto.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/** Change a colour. Leave a field out (null) to keep it. The SKU itself can't change. */
public record VariantUpdateRequest(
        @Size(min = 1, max = 60) String colorName,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "a colour like #3b1f3a") String colorHex,
        @Min(0) Integer stock,
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal priceOverride,
        Boolean clearPriceOverride,
        @Size(max = 12) List<String> images,
        Boolean isDefault) {
}
