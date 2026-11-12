package com.velanoire.api.dto.admin;

import com.velanoire.api.model.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusRequest(@NotNull OrderStatus status) {
}
