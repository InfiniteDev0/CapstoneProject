package com.luxuryshop.api.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * One line in a customer's shopping bag. One row per colour (sku) and size;
 * adding the same again raises the quantity. product_id / sku point into MongoDB.
 */
@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
public class CartItem {

    public static final String ONE_SIZE = "ONE_SIZE";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 24, columnDefinition = "char(24)")
    private String productId;

    @Column(nullable = false, length = 40)
    private String sku;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(nullable = false, length = 10)
    private String selectedSize = ONE_SIZE;

    @Column(length = 500)
    private String comments;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
