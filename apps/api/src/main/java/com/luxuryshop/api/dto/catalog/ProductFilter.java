package com.luxuryshop.api.dto.catalog;

import java.math.BigDecimal;
import java.util.List;

/**
 * The shop's filters, read from the URL: /api/store/products?category=men&subCategory=outerwear&maxPrice=500&sort=price_asc
 * isNew=true gives the "New" tab; size=M keeps products that come in M.
 * sort: newest (default), price_asc, price_desc, rating, popular, relevance (with q).
 */
public record ProductFilter(
        String category,
        String subCategory,
        Boolean isNew,
        Boolean isBestSeller,
        String productSize,
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
