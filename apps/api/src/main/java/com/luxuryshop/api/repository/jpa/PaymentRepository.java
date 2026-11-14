package com.luxuryshop.api.repository.jpa;

import com.luxuryshop.api.model.entity.Payment;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findFirstByOrderIdOrderByIdDesc(Long orderId);
}
