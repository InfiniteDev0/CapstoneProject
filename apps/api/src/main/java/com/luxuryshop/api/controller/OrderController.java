package com.luxuryshop.api.controller;

import com.luxuryshop.api.dto.common.PageResponse;
import com.luxuryshop.api.dto.order.CheckoutRequest;
import com.luxuryshop.api.dto.order.OrderResponse;
import com.luxuryshop.api.dto.order.OrderSummary;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.CheckoutService;
import com.luxuryshop.api.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "6. Orders", description = "Simulated checkout and order history")
public class OrderController {

    private final CheckoutService checkout;
    private final OrderService orders;

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Turn my bag into a paid order (simulated: no money moves)",
            description = "Lowers stock in MongoDB, writes order + lines + payment in MySQL, empties the bag.")
    public OrderResponse checkout(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody CheckoutRequest request,
            @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
        return checkout.checkout(me.id(), request, userAgent);
    }

    @GetMapping
    @Operation(summary = "My orders, newest first")
    public PageResponse<OrderSummary> myOrders(@AuthenticationPrincipal AuthUser me,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        return orders.myOrders(me.id(), page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "One of my orders: lines and payment")
    public OrderResponse myOrder(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return orders.myOrder(me.id(), id);
    }
}
