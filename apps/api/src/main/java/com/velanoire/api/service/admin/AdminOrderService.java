package com.velanoire.api.service.admin;

import com.velanoire.api.dto.admin.AdminOrderRow;
import com.velanoire.api.dto.common.PageResponse;
import com.velanoire.api.dto.order.OrderResponse;
import com.velanoire.api.exception.ApiException;
import com.velanoire.api.model.entity.Order;
import com.velanoire.api.model.entity.OrderStatus;
import com.velanoire.api.model.entity.Payment;
import com.velanoire.api.model.entity.PaymentStatus;
import com.velanoire.api.model.entity.User;
import com.velanoire.api.repository.jpa.OrderRepository;
import com.velanoire.api.repository.jpa.PaymentRepository;
import com.velanoire.api.repository.jpa.UserRepository;
import com.velanoire.api.service.StockService;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** All orders, for the manager: list, open, and move along (PAID → PROCESSING → SHIPPED → DELIVERED). */
@Service
@RequiredArgsConstructor
public class AdminOrderService {

    /** Where an order may go next. Cancelled and refunded orders are finished. */
    private static final Map<OrderStatus, Set<OrderStatus>> NEXT = Map.of(
            OrderStatus.PENDING, EnumSet.of(OrderStatus.PAID, OrderStatus.CANCELLED),
            OrderStatus.PAID, EnumSet.of(OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED),
            OrderStatus.PROCESSING, EnumSet.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED),
            OrderStatus.SHIPPED, EnumSet.of(OrderStatus.DELIVERED, OrderStatus.REFUNDED),
            OrderStatus.DELIVERED, EnumSet.of(OrderStatus.REFUNDED),
            OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.REFUNDED, EnumSet.noneOf(OrderStatus.class));

    private final OrderRepository orders;
    private final PaymentRepository payments;
    private final UserRepository users;
    private final StockService stock;

    @Transactional(readOnly = true)
    public PageResponse<AdminOrderRow> list(OrderStatus status, String search, int page, int size) {
        String q = search == null || search.isBlank() ? null : "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        Page<Order> result = orders.adminSearch(status, q, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        Map<Long, User> customers = users.findAllById(result.getContent().stream().map(Order::getUserId).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        List<AdminOrderRow> rows = result.getContent().stream().map(o -> {
            User u = customers.get(o.getUserId());
            int items = o.getItems().stream().mapToInt(i -> i.getQuantity()).sum();
            return new AdminOrderRow(o.getId(), o.getOrderNumber(), o.getUserId(), u == null ? null : u.getName(),
                    u == null ? null : u.getEmail(), o.getStatus(), o.getTotal(), items, o.getShippingCountry(), o.getCreatedAt());
        }).toList();
        return PageResponse.of(rows, page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public OrderResponse get(Long id) {
        Order o = orders.findById(id).orElseThrow(() -> ApiException.notFound("Order not found"));
        return OrderResponse.from(o, payments.findFirstByOrderIdOrderByIdDesc(id).orElse(null));
    }

    /**
     * Move an order to its next status. Cancelling or refunding puts the pieces back on the shelf
     * (MongoDB) and marks the payment refunded, but only AFTER MySQL has saved the change:
     * if the save failed, we must not hand stock back for an order that is still live.
     */
    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus next) {
        Order o = orders.findById(id).orElseThrow(() -> ApiException.notFound("Order not found"));
        if (!NEXT.get(o.getStatus()).contains(next)) {
            throw ApiException.badRequest("An order that is " + o.getStatus() + " can't become " + next
                    + (NEXT.get(o.getStatus()).isEmpty() ? " (it's finished)" : ". Allowed: " + NEXT.get(o.getStatus())));
        }
        o.setStatus(next);
        Payment payment = payments.findFirstByOrderIdOrderByIdDesc(id).orElse(null);

        if (next == OrderStatus.CANCELLED || next == OrderStatus.REFUNDED) {
            if (payment != null && payment.getStatus() == PaymentStatus.SUCCEEDED) payment.setStatus(PaymentStatus.REFUNDED);
            List<StockService.StockLine> giveBack = o.getItems().stream()
                    .map(i -> new StockService.StockLine(i.getProductId(), i.getSku(), i.getQuantity(), i.getProductName()))
                    .toList();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    stock.release(giveBack);
                }
            });
        }
        return OrderResponse.from(o, payment);
    }
}
