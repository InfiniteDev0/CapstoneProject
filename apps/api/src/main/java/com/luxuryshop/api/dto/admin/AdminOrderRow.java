package com.luxuryshop.api.dto.admin;

import com.luxuryshop.api.model.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;

/** One order in the admin orders table. */
public record AdminOrderRow(Long id, String orderNumber, Long customerId, String customerName, String customerEmail,
        OrderStatus status, BigDecimal total, int itemCount, String shippingCountry, Instant createdAt) {
}
