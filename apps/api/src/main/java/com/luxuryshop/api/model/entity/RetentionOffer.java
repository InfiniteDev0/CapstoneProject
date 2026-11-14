package com.luxuryshop.api.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A win-back discount code an admin sends to a customer at risk of leaving.
 * Phase 7 creates them from churn predictions; checkout can already redeem one.
 */
@Entity
@Table(name = "retention_offers")
@Getter
@Setter
@NoArgsConstructor
public class RetentionOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long churnPredictionId;

    private Long sentBy;

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @JdbcTypeCode(SqlTypes.TINYINT)
    @Column(nullable = false)
    private Integer percentOff;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status = OfferStatus.SENT;

    @Column(length = 255)
    private String message;

    @Column(nullable = false)
    private Instant sentAt;

    private Instant expiresAt;

    private Instant redeemedAt;
}
