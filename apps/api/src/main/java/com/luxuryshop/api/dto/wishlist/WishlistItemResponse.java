package com.luxuryshop.api.dto.wishlist;

import com.luxuryshop.api.dto.catalog.ProductSummary;
import java.time.Instant;

/** A hearted product. `product` is null if it has since been removed from the catalogue. */
public record WishlistItemResponse(String productId, Instant addedAt, ProductSummary product) {
}
