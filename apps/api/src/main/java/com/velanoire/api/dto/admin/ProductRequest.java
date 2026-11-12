package com.velanoire.api.dto.admin;

import com.velanoire.api.model.document.Product;
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

/**
 * Create or replace a product (admin). slug is optional: it's made from the name if left out.
 * abaya / perfume details only for those categories. At least one colour variant.
 */
public record ProductRequest(
        @NotBlank @Size(min = 2, max = 200) String name,
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "lowercase words joined by dashes, e.g. velvet-moon-abaya") String slug,
        @Size(max = 4000) String description,
        @Size(max = 2000) String story,
        @NotBlank String category,
        String collection,
        @Pattern(regexp = "SUMMER|WINTER|AUTUMN|SPRING") String season,
        @Size(max = 80) String seasonalLine,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal basePrice,
        @Min(0) @Max(90) Integer discountPercent,
        @Pattern(regexp = "IN_PRODUCTION|READY_TO_LAUNCH|LIVE|SOLD_OUT|DISCONTINUED") String status,
        Boolean isNew,
        Boolean isBestSeller,
        Boolean isLimitedEdition,
        @Size(max = 20) List<@NotBlank @Size(max = 40) String> tags,
        @Size(max = 12) List<@NotBlank String> images,
        Product.AbayaDetails abaya,
        Product.PerfumeDetails perfume,
        @NotEmpty @Size(max = 30) List<@Valid VariantRequest> variants) {
}
