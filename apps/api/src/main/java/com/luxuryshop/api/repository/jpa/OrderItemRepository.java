package com.luxuryshop.api.repository.jpa;

import com.luxuryshop.api.model.entity.OrderItem;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Has this customer really bought this product? (marks a review "verified purchase") */
    @Query("""
            select count(i) > 0 from OrderItem i
            where i.order.userId = :userId and i.productId = :productId
              and i.order.status not in (com.luxuryshop.api.model.entity.OrderStatus.CANCELLED,
                                         com.luxuryshop.api.model.entity.OrderStatus.REFUNDED)
            """)
    boolean hasPurchased(@Param("userId") Long userId, @Param("productId") String productId);

    /** Best-selling categories: rows of [category, revenue, unitsSold], highest revenue first. */
    @Query("""
            select i.category, coalesce(sum(i.lineTotal), 0), coalesce(sum(i.quantity), 0) from OrderItem i
            where i.order.status not in (com.luxuryshop.api.model.entity.OrderStatus.CANCELLED,
                                         com.luxuryshop.api.model.entity.OrderStatus.REFUNDED)
            group by i.category
            order by sum(i.lineTotal) desc
            """)
    List<Object[]> topCategories(Pageable limit);
}
