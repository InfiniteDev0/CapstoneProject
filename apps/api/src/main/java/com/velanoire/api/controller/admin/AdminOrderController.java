package com.velanoire.api.controller.admin;

import com.velanoire.api.dto.admin.AdminOrderRow;
import com.velanoire.api.dto.admin.OrderStatusRequest;
import com.velanoire.api.dto.common.PageResponse;
import com.velanoire.api.dto.order.OrderResponse;
import com.velanoire.api.model.entity.OrderStatus;
import com.velanoire.api.service.admin.AdminOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@Tag(name = "9. Admin: orders")
public class AdminOrderController {

    private final AdminOrderService orders;

    @GetMapping
    @Operation(summary = "All orders, newest first (filter by status; search order number, name or email)")
    public PageResponse<AdminOrderRow> list(@RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return orders.list(status, search, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "One order with lines and payment")
    public OrderResponse get(@PathVariable Long id) {
        return orders.get(id);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Move an order along (cancel/refund puts the stock back)",
            description = "PAID → PROCESSING → SHIPPED → DELIVERED; CANCELLED before shipping; REFUNDED after paying.")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody OrderStatusRequest request) {
        return orders.updateStatus(id, request.status());
    }
}
