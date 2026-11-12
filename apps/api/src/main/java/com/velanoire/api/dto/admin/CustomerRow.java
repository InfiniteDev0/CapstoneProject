package com.velanoire.api.dto.admin;

import com.velanoire.api.model.entity.Gender;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * One customer in the admin list. churnRisk stays null until Phase 7
 * (the smart waiter fills it: HIGH / MEDIUM / LOW).
 */
public record CustomerRow(Long id, String name, String email, String country, Gender gender, boolean active,
        Instant createdAt, Instant lastLoginAt, long orderCount, BigDecimal totalSpent, long deviceCount, String churnRisk) {
}
