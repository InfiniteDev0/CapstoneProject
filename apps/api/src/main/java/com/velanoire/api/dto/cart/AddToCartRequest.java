package com.velanoire.api.dto.cart;

import com.velanoire.api.model.entity.AbayaStyle;
import com.velanoire.api.model.entity.ShaylaType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** "Add to bag". selectedSize is only for abayas (XS..3XL, Custom); leave it out for everything else. */
public record AddToCartRequest(
        @NotBlank @Pattern(regexp = "^[0-9a-fA-F]{24}$", message = "must be a product id (24 hex characters)") String productId,
        @NotBlank @Size(max = 40) String sku,
        @NotNull @Min(1) @Max(20) Integer quantity,
        @Size(max = 10) String selectedSize,
        AbayaStyle selectedStyle,
        ShaylaType shaylaType,
        @Size(max = 500) String customMeasurementsUrl,
        @Size(max = 500) String comments) {
}
