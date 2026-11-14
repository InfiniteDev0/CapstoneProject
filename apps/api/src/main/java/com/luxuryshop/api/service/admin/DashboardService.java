package com.luxuryshop.api.service.admin;

import com.luxuryshop.api.dto.admin.AdminProductRow;
import com.luxuryshop.api.dto.admin.DashboardStats;
import com.luxuryshop.api.model.document.Product;
import com.luxuryshop.api.model.entity.Role;
import com.luxuryshop.api.repository.jpa.OrderItemRepository;
import com.luxuryshop.api.repository.jpa.OrderRepository;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.service.Pricing;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The dashboard numbers: sales and orders (MySQL), customers (MySQL), low stock (MongoDB). */
@Service
@RequiredArgsConstructor
public class DashboardService {

    /** "Active" = logged in during the last 30 days. */
    public static final int ACTIVE_DAYS = 30;

    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final UserRepository users;
    private final MongoTemplate mongo;

    @Transactional(readOnly = true)
    public DashboardStats stats() {
        Instant since30 = Instant.now().minus(ACTIVE_DAYS, ChronoUnit.DAYS);
        BigDecimal sales = Pricing.money(orders.totalSales());
        long orderCount = orders.countSales();
        BigDecimal average = orderCount == 0 ? Pricing.money(BigDecimal.ZERO)
                : sales.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP);

        List<DashboardStats.TopCategory> top = orderItems.topCategories(PageRequest.of(0, 5)).stream()
                .map(r -> new DashboardStats.TopCategory((String) r[0], Pricing.money((BigDecimal) r[1]), ((Number) r[2]).longValue()))
                .toList();

        // The last 6 months, oldest first (for the sales chart in Phase 7)
        Instant sixMonthsAgo = LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1).minusMonths(5).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<DashboardStats.MonthlySales> months = orders.salesByMonth(sixMonthsAgo).stream()
                .map(r -> new DashboardStats.MonthlySales((String) r[0], Pricing.money(new BigDecimal(r[1].toString())),
                        ((Number) r[2]).longValue()))
                .toList();

        return new DashboardStats(sales, orderCount, average,
                users.countByRole(Role.CUSTOMER),
                users.countByRoleAndLastLoginAtAfter(Role.CUSTOMER, since30), ACTIVE_DAYS,
                users.countByRoleAndCreatedAtAfter(Role.CUSTOMER, since30),
                null, // churn rate: Phase 7
                lowStockVariants(), top, months);
    }

    /** How many colours have 5 or fewer pieces left (counted inside MongoDB). */
    private long lowStockVariants() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.unwind("variants"),
                Aggregation.match(Criteria.where("variants.stock").lte(AdminProductRow.LOW_STOCK)),
                Aggregation.count().as("n"));
        var result = mongo.aggregate(agg, Product.class, org.bson.Document.class).getUniqueMappedResult();
        return result == null ? 0 : result.get("n", Number.class).longValue();
    }
}
