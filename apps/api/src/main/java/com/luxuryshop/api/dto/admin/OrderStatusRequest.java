package com.luxuryshop.api.dto.admin;

import com.luxuryshop.api.model.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusRequest(@NotNull OrderStatus status) {
}
