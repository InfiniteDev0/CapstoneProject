package com.luxuryshop.api.repository.jpa;

import com.luxuryshop.api.model.entity.CartItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<CartItem> findByUserIdAndSkuAndSelectedSize(Long userId, String sku, String selectedSize);

    /** "...AndUserId" makes sure customers can only touch their own bag. */
    Optional<CartItem> findByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);

    /** How many pieces are in the bag (the number on the bag icon). */
    @Query("select coalesce(sum(c.quantity), 0) from CartItem c where c.userId = :userId")
    long countPieces(@Param("userId") Long userId);

    /** A product was deleted from the catalogue: take it out of every bag (no cross-database cascade). */
    void deleteByProductId(String productId);
}
