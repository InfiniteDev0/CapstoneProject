package com.velanoire.api.dto.admin;

import java.math.BigDecimal;
import java.util.List;

/**
 * The admin dashboard numbers. Sales count only orders that weren't cancelled or refunded.
 * churnRate stays null until Phase 7 (the smart waiter).
 */
public record DashboardStats(
        BigDecimal totalSales,
        long orderCount,
        BigDecimal averageOrderValue,
        long totalCustomers,
        long activeUsers,
        int activeWindowDays,
        long newCustomersLast30Days,
        Double churnRate,
        long lowStockVariants,
        List<TopCategory> topCategories,
        List<MonthlySales> salesByMonth) {

    public record TopCategory(String category, BigDecimal revenue, long unitsSold) {
    }

    public record MonthlySales(String month, BigDecimal revenue, long orders) {
    }
}
