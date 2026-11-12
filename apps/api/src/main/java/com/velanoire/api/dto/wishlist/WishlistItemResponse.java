package com.velanoire.api.dto.wishlist;

import com.velanoire.api.dto.catalog.ProductSummary;
import java.time.Instant;

/** A hearted product. `product` is null if it has since been removed from the catalogue. */
public record WishlistItemResponse(String productId, Instant addedAt, ProductSummary product) {
}
