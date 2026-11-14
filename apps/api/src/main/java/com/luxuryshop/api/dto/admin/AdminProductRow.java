package com.luxuryshop.api.dto.admin;

import com.luxuryshop.api.model.document.Product;
import java.math.BigDecimal;
import java.time.Instant;

/** One row in the admin product table. lowStock = some colour has 5 or fewer left. */
public record AdminProductRow(String id, String name, String slug, String category, String subCategory, String status,
        BigDecimal basePrice, int variantCount, int totalStock, boolean lowStock, String image, Instant updatedAt) {

    public static final int LOW_STOCK = 5;

    public static AdminProductRow from(Product p) {
        boolean low = p.getVariants().stream().anyMatch(v -> v.getStock() == null || v.getStock() <= LOW_STOCK);
        return new AdminProductRow(p.getId(), p.getName(), p.getSlug(), p.getCategory(), p.getSubCategory(), p.getStatus(),
                p.getBasePrice(), p.getVariants().size(), p.totalStock(), low,
                p.getImages().isEmpty() ? null : p.getImages().get(0), p.getUpdatedAt());
    }
}
