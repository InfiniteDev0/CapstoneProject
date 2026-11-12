package com.velanoire.api.repository.jpa;

import com.velanoire.api.model.entity.RetentionOffer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RetentionOfferRepository extends JpaRepository<RetentionOffer, Long> {

    Optional<RetentionOffer> findByCode(String code);
}
