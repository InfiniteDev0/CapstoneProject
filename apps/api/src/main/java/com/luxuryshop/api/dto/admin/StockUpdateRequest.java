package com.luxuryshop.api.dto.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Set how many pieces of one colour are on the shelf. */
public record StockUpdateRequest(@NotNull @Min(0) @Max(100000) Integer stock) {
}
