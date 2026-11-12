package com.velanoire.api.dto.catalog;

import java.math.BigDecimal;
import java.util.List;

/**
 * The shop's filters, read from the URL: /api/store/products?category=abaya&maxPrice=150&sort=price_asc
 * sort: newest (default), price_asc, price_desc, rating, popular, relevance (with q).
 */
public record ProductFilter(
        String category,
        String collection,
        String season,
        String seasonalLine,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        List<String> tags,
        String q,
        String sort,
        Integer page,
        Integer size) {

    public int pageOrDefault() {
        return page == null || page < 0 ? 0 : page;
    }

    public int sizeOrDefault() {
        return size == null || size < 1 ? 12 : Math.min(size, 60);
    }
}
