package com.velanoire.api.dto.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/** One colour of a product. The SKU must be unique across the whole catalogue. */
public record VariantRequest(
        @NotBlank @Pattern(regexp = "^VN-[A-Z0-9-]+$", message = "like VN-ABY-VM-01-PLM") @Size(max = 40) String sku,
        @NotBlank @Size(max = 60) String colorName,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "a colour like #3b1f3a") String colorHex,
        @NotNull @Min(0) Integer stock,
        @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal priceOverride,
        @Size(max = 12) List<@NotBlank String> images,
        Boolean isDefault) {
}
