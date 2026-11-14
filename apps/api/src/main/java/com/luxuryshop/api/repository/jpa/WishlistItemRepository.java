package com.luxuryshop.api.repository.jpa;

import com.luxuryshop.api.model.entity.WishlistItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    List<WishlistItem> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<WishlistItem> findByUserIdAndProductId(Long userId, String productId);

    void deleteByProductId(String productId);
}
