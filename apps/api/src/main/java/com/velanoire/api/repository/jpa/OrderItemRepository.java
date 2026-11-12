package com.velanoire.api.repository.jpa;

import com.velanoire.api.model.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Has this customer really bought this product? (marks a review "verified purchase") */
    @Query("""
            select count(i) > 0 from OrderItem i
            where i.order.userId = :userId and i.productId = :productId
              and i.order.status not in (com.velanoire.api.model.entity.OrderStatus.CANCELLED,
                                         com.velanoire.api.model.entity.OrderStatus.REFUNDED)
            """)
    boolean hasPurchased(@Param("userId") Long userId, @Param("productId") String productId);
}
