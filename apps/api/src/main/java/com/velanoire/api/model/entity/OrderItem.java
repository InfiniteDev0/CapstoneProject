package com.velanoire.api.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A line on a receipt. A SNAPSHOT: name, category and price are copied at purchase time,
 * so the receipt stays true even if the product changes in MongoDB later.
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false, length = 24, columnDefinition = "char(24)")
    private String productId;

    @Column(nullable = false, length = 40)
    private String sku;

    @Column(nullable = false, length = 200)
    private String productName;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(length = 80)
    private String collection;

    @Column(length = 60)
    private String colorName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    /** Worked out by MySQL itself (unit_price * quantity), so Java never writes it. */
    @Column(precision = 10, scale = 2, insertable = false, updatable = false)
    private BigDecimal lineTotal;

    @Column(nullable = false, length = 10)
    private String selectedSize = CartItem.ONE_SIZE;

    @Enumerated(EnumType.STRING)
    private AbayaStyle selectedStyle;

    @Enumerated(EnumType.STRING)
    private ShaylaType shaylaType;

    @Column(length = 500)
    private String customMeasurementsUrl;

    @Column(length = 500)
    private String comments;
}
