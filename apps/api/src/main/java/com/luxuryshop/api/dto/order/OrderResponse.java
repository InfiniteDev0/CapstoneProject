package com.luxuryshop.api.dto.order;

import com.luxuryshop.api.model.entity.Order;
import com.luxuryshop.api.model.entity.OrderItem;
import com.luxuryshop.api.model.entity.OrderStatus;
import com.luxuryshop.api.model.entity.Payment;
import com.luxuryshop.api.model.entity.PaymentMethod;
import com.luxuryshop.api.model.entity.PaymentStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

/** A full receipt: the order, its lines (the price snapshot) and the payment. */
public record OrderResponse(
        Long id,
        String orderNumber,
        Long userId,
        OrderStatus status,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal shippingFee,
        BigDecimal total,
        String currency,
        String shippingName,
        String shippingAddress,
        String shippingCity,
        String shippingCountry,
        Instant createdAt,
        List<Item> items,
        PaymentInfo payment) {

    public record Item(Long id, String productId, String sku, String productName, String category, String subCategory,
            String colorName, BigDecimal unitPrice, int quantity, BigDecimal lineTotal, String selectedSize) {

        static Item from(OrderItem i) {
            // line_total is computed by MySQL; work it out here too for a freshly saved order
            BigDecimal line = i.getLineTotal() != null ? i.getLineTotal()
                    : i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            return new Item(i.getId(), i.getProductId(), i.getSku(), i.getProductName(), i.getCategory(), i.getSubCategory(),
                    i.getColorName(), i.getUnitPrice(), i.getQuantity(), line, i.getSelectedSize());
        }
    }

    public record PaymentInfo(PaymentMethod method, PaymentStatus status, String reference, String cardLast4,
            BigDecimal amount, Instant paidAt) {

        static PaymentInfo from(Payment p) {
            return p == null ? null
                    : new PaymentInfo(p.getMethod(), p.getStatus(), p.getReference(), p.getCardLast4(), p.getAmount(), p.getPaidAt());
        }
    }

    public static OrderResponse from(Order o, Payment payment) {
        return new OrderResponse(o.getId(), o.getOrderNumber(), o.getUserId(), o.getStatus(), o.getSubtotal(),
                o.getDiscountAmount(), o.getShippingFee(), o.getTotal(), o.getCurrency(), o.getShippingName(),
                o.getShippingAddress(), o.getShippingCity(), o.getShippingCountry(), o.getCreatedAt(),
                o.getItems().stream().map(Item::from).toList(), PaymentInfo.from(payment));
    }
}
