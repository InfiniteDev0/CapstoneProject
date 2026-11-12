package com.velanoire.api.model.entity;

/** Whether the (simulated) payment went through. */
public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    FAILED,
    REFUNDED
}
