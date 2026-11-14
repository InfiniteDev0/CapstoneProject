package com.luxuryshop.api.repository.jpa;

import com.luxuryshop.api.model.entity.RetentionOffer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RetentionOfferRepository extends JpaRepository<RetentionOffer, Long> {

    Optional<RetentionOffer> findByCode(String code);
}
