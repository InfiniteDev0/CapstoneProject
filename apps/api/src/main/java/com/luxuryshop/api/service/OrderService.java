package com.luxuryshop.api.service;

import com.luxuryshop.api.dto.common.PageResponse;
import com.luxuryshop.api.dto.order.OrderResponse;
import com.luxuryshop.api.dto.order.OrderSummary;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.entity.Order;
import com.luxuryshop.api.repository.jpa.OrderRepository;
import com.luxuryshop.api.repository.jpa.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** "My orders": a customer's own receipts, newest first. */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orders;
    private final PaymentRepository payments;

    /** readOnly transaction: keeps the database session open while we read each order's lines. */
    @Transactional(readOnly = true)
    public PageResponse<OrderSummary> myOrders(Long userId, int page, int size) {
        return PageResponse.of(orders.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size)), OrderSummary::from);
    }

    @Transactional(readOnly = true)
    public OrderResponse myOrder(Long userId, Long orderId) {
        // "...AndUserId": someone else's order looks exactly like a missing one (no peeking by guessing ids)
        Order order = orders.findByIdAndUserId(orderId, userId).orElseThrow(() -> ApiException.notFound("Order not found"));
        return OrderResponse.from(order, payments.findFirstByOrderIdOrderByIdDesc(order.getId()).orElse(null));
    }
}
