package com.luxuryshop.api.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Create or replace a product (admin). slug is optional: it's made from the name if left out.
 * subCategory must belong to the category. sizes: what shoppers pick from (empty = one size).
 * attributes: specs shown on the product page, e.g. { "Material": "Merino wool", "Fit": "Relaxed" }.
 * At least one colour variant.
 */
public record ProductRequest(
        @NotBlank @Size(min = 2, max = 200) String name,
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "lowercase words joined by dashes, e.g. aero-knit-tee") String slug,
        @Size(max = 4000) String description,
        @NotBlank String category,
        @NotBlank String subCategory,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal basePrice,
        @Min(0) @Max(90) Integer discountPercent,
        @Pattern(regexp = "IN_PRODUCTION|READY_TO_LAUNCH|LIVE|SOLD_OUT|DISCONTINUED") String status,
        Boolean isNew,
        Boolean isBestSeller,
        @Size(max = 20) List<@NotBlank @Size(max = 40) String> tags,
        @Size(max = 12) List<@NotBlank String> images,
        @Size(max = 12) List<@NotBlank @Size(max = 10) String> sizes,
        @Size(max = 20) Map<@NotBlank @Size(max = 40) String, @NotBlank @Size(max = 200) String> attributes,
        @NotEmpty @Size(max = 30) List<@Valid VariantRequest> variants) {
}
