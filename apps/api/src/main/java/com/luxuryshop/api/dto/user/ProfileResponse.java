package com.luxuryshop.api.dto.user;

import com.luxuryshop.api.model.entity.Gender;
import com.luxuryshop.api.model.entity.Role;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * The "My VN" profile: demographics, preferences and the numbers the spec asks for
 * (tenure, devices). The same numbers later feed the churn model.
 */
public record ProfileResponse(
        Long id,
        String name,
        String email,
        Role role,
        String phone,
        String country,
        String city,
        Gender gender,
        LocalDate dateOfBirth,
        List<String> preferredCategories,
        Instant createdAt,
        Instant lastLoginAt,
        long tenureDays,
        long deviceCount,
        List<Device> devices,
        long orderCount,
        BigDecimal totalSpent) {

    public record Device(String deviceType, String os, String browser, Instant firstSeen, Instant lastSeen) {
    }
}
