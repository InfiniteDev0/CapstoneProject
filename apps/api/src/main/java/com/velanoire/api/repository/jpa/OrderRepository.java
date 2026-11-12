package com.velanoire.api.repository.jpa;

import com.velanoire.api.model.entity.Order;
import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    /** Total a customer has spent on orders that weren't cancelled or refunded. */
    @Query("""
            select coalesce(sum(o.total), 0) from Order o
            where o.userId = :userId
              and o.status not in (com.velanoire.api.model.entity.OrderStatus.CANCELLED,
                                   com.velanoire.api.model.entity.OrderStatus.REFUNDED)
            """)
    BigDecimal totalSpentBy(@Param("userId") Long userId);
}
