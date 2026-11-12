package com.velanoire.api.dto.catalog;

import com.velanoire.api.model.document.Product;
import com.velanoire.api.service.Pricing;
import java.math.BigDecimal;
import java.util.List;

/** A product card in a list: just what the shop grid needs. */
public record ProductSummary(
        String id,
        String name,
        String slug,
        String category,
        String collection,
        String season,
        String seasonalLine,
        BigDecimal price,
        BigDecimal finalPrice,
        int discountPercent,
        String image,
        List<Swatch> colors,
        boolean inStock,
        double ratingAverage,
        int ratingCount,
        boolean isNew,
        boolean isBestSeller,
        boolean isLimitedEdition,
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
                p.getId(), p.getName(), p.getSlug(), p.getCategory(), p.getCollection(), p.getSeason(), p.getSeasonalLine(),
                p.getBasePrice(), Pricing.unitPrice(p, null), p.getDiscountPercent() == null ? 0 : p.getDiscountPercent(),
                p.getImages().isEmpty() ? null : p.getImages().get(0),
                colors, p.totalStock() > 0,
                ratings == null || ratings.getAverage() == null ? 0 : ratings.getAverage(),
                ratings == null || ratings.getCount() == null ? 0 : ratings.getCount(),
                Boolean.TRUE.equals(p.getIsNew()), Boolean.TRUE.equals(p.getIsBestSeller()),
                Boolean.TRUE.equals(p.getIsLimitedEdition()), p.getTags());
    }
}
