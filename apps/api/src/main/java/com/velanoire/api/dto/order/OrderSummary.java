package com.velanoire.api.dto.order;

import com.velanoire.api.model.entity.Order;
import com.velanoire.api.model.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;

/** One row in "My orders". */
public record OrderSummary(Long id, String orderNumber, OrderStatus status, BigDecimal total, String currency,
        int itemCount, String firstItemName, Instant createdAt) {

    public static OrderSummary from(Order o) {
        int count = o.getItems().stream().mapToInt(i -> i.getQuantity()).sum();
        String first = o.getItems().isEmpty() ? null : o.getItems().get(0).getProductName();
        return new OrderSummary(o.getId(), o.getOrderNumber(), o.getStatus(), o.getTotal(), o.getCurrency(), count, first,
                o.getCreatedAt());
    }
}
