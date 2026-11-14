package com.luxuryshop.api.dto.cart;

import java.math.BigDecimal;
import java.util.List;

/** The shopping bag, priced from the live catalogue. Free shipping from freeShippingFrom. */
public record CartResponse(
        List<Line> items,
        int itemCount,
        BigDecimal subtotal,
        BigDecimal shippingFee,
        BigDecimal total,
        BigDecimal freeShippingFrom) {

    /** One line in the bag. available = false if it is sold out or there is less stock than wanted. */
    public record Line(
            Long id,
            String productId,
            String slug,
            String name,
            String image,
            String category,
            String sku,
            String colorName,
            String selectedSize,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal,
            int stock,
            boolean available) {
    }
}
