package com.velanoire.api.dto.order;

import com.velanoire.api.model.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Simulated checkout: where to send it and how "payment" was made. No real card is charged. */
public record CheckoutRequest(
        @NotBlank @Size(max = 120) String shippingName,
        @NotBlank @Size(max = 255) String shippingAddress,
        @NotBlank @Size(max = 80) String shippingCity,
        @NotBlank @Size(max = 60) String shippingCountry,
        @NotNull PaymentMethod paymentMethod,
        @Pattern(regexp = "^\\d{4}$", message = "must be the last 4 digits") String cardLast4,
        @Size(max = 32) String discountCode) {
}
