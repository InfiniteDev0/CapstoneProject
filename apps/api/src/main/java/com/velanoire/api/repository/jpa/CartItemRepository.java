package com.velanoire.api.repository.jpa;

import com.velanoire.api.model.entity.CartItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<CartItem> findByUserIdAndSkuAndSelectedSize(Long userId, String sku, String selectedSize);

    /** "...AndUserId" makes sure customers can only touch their own bag. */
    Optional<CartItem> findByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);

    /** A product was deleted from the catalogue: take it out of every bag (no cross-database cascade). */
    void deleteByProductId(String productId);
}
