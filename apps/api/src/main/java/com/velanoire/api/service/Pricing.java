package com.velanoire.api.service;

import com.velanoire.api.model.document.Product;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The price rules in one place, so the cart, checkout and product cards always agree.
 * Money is BigDecimal (exact): 0.1 + 0.2 is 0.3, not 0.30000000000000004 like a double.
 */
public final class Pricing {

    /** Orders from this subtotal ship free ("Free Shipping on All Orders Above $75"). */
    public static final BigDecimal FREE_SHIPPING_FROM = new BigDecimal("75.00");
    public static final BigDecimal SHIPPING_FEE = new BigDecimal("10.00");

    private Pricing() {
    }

    /** One piece's price: the colour's own price if it has one, else the base price, minus any discount. */
    public static BigDecimal unitPrice(Product product, Product.ProductVariant variant) {
        BigDecimal price = variant != null && variant.getPriceOverride() != null
                ? variant.getPriceOverride()
                : product.getBasePrice();
        int discount = product.getDiscountPercent() == null ? 0 : product.getDiscountPercent();
        if (discount > 0) {
            price = price.multiply(BigDecimal.valueOf(100 - discount)).divide(BigDecimal.valueOf(100));
        }
        return money(price);
    }

    public static BigDecimal shippingFor(BigDecimal subtotal) {
        if (subtotal.signum() == 0 || subtotal.compareTo(FREE_SHIPPING_FROM) >= 0) {
            return money(BigDecimal.ZERO);
        }
        return SHIPPING_FEE;
    }

    public static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
