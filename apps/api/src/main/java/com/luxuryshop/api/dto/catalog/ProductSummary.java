package com.luxuryshop.api.dto.catalog;

import com.luxuryshop.api.model.document.Product;
import com.luxuryshop.api.service.Pricing;
import java.math.BigDecimal;
import java.util.List;

/** A product card in a list: just what the shop grid needs. */
public record ProductSummary(
        String id,
        String name,
        String slug,
        String category,
        String subCategory,
        BigDecimal price,
        BigDecimal finalPrice,
        int discountPercent,
        String image,
        String hoverImage,
        List<Swatch> colors,
        boolean inStock,
        double ratingAverage,
        int ratingCount,
        boolean isNew,
        boolean isBestSeller,
        List<String> sizes,
        List<String> tags) {

    /** One colour dot on the card. */
    public record Swatch(String sku, String name, String hex, boolean inStock) {
    }

    public static ProductSummary from(Product p) {
        var colors = p.getVariants().stream()
                .map(v -> new Swatch(v.getSku(), v.getColorName(), v.getColorHex(), v.getStock() != null && v.getStock() > 0))
                .toList();
        var ratings = p.getRatings();
        return new ProductSummary(
                p.getId(), p.getName(), p.getSlug(), p.getCategory(), p.getSubCategory(),
                p.getBasePrice(), Pricing.unitPrice(p, null), p.getDiscountPercent() == null ? 0 : p.getDiscountPercent(),
                p.getImages().isEmpty() ? null : p.getImages().get(0),
                p.getImages().size() > 1 ? p.getImages().get(1) : null,
                colors, p.totalStock() > 0,
                ratings == null || ratings.getAverage() == null ? 0 : ratings.getAverage(),
                ratings == null || ratings.getCount() == null ? 0 : ratings.getCount(),
                Boolean.TRUE.equals(p.getIsNew()), Boolean.TRUE.equals(p.getIsBestSeller()),
                p.getSizes(), p.getTags());
    }
}
