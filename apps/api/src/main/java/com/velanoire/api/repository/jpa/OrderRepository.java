package com.velanoire.api.repository.jpa;

import com.velanoire.api.model.entity.Order;
import com.velanoire.api.model.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Orders that count as sales (not cancelled or refunded). Used in several queries below. */
    String COUNTED = "o.status not in (com.velanoire.api.model.entity.OrderStatus.CANCELLED, "
            + "com.velanoire.api.model.entity.OrderStatus.REFUNDED)";

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    /** Total a customer has spent on orders that weren't cancelled or refunded. */
    @Query("select coalesce(sum(o.total), 0) from Order o where o.userId = :userId and " + COUNTED)
    BigDecimal totalSpentBy(@Param("userId") Long userId);

    /** For the admin customer list: [userId, orderCount, totalSpent] for a page of customers at once. */
    @Query("select o.userId, count(o), coalesce(sum(o.total), 0) from Order o where o.userId in :ids and " + COUNTED
            + " group by o.userId")
    List<Object[]> statsForUsers(@Param("ids") Collection<Long> ids);

    /** Admin orders table: optional status, optional search on order number or customer name/email. */
    @Query("""
            select o from Order o
            where (:status is null or o.status = :status)
              and (:q is null or lower(o.orderNumber) like :q
                   or o.userId in (select u.id from User u where lower(u.email) like :q or lower(u.name) like :q))
            """)
    Page<Order> adminSearch(@Param("status") OrderStatus status, @Param("q") String q, Pageable pageable);

    // --- Dashboard -------------------------------------------------------------

    @Query("select coalesce(sum(o.total), 0) from Order o where " + COUNTED)
    BigDecimal totalSales();

    @Query("select count(o) from Order o where " + COUNTED)
    long countSales();

    /** Revenue and order count per month since a date: rows of [YYYY-MM, revenue, orders]. */
    @Query(value = """
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(total) AS revenue, COUNT(*) AS orders
            FROM orders
            WHERE status NOT IN ('CANCELLED', 'REFUNDED') AND created_at >= :since
            GROUP BY month ORDER BY month
            """, nativeQuery = true)
    List<Object[]> salesByMonth(@Param("since") Instant since);
}
