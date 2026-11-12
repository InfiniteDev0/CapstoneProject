package com.velanoire.api.dto.review;

import com.velanoire.api.model.document.Review;
import java.time.Instant;

public record ReviewResponse(
        String id, String productId, String userName, int rating, String title, String comment,
        boolean verifiedPurchase, Instant createdAt) {

    public static ReviewResponse from(Review r) {
        return new ReviewResponse(r.getId(), r.getProductId(), r.getUserName(), r.getRating(), r.getTitle(),
                r.getComment(), Boolean.TRUE.equals(r.getVerifiedPurchase()), r.getCreatedAt());
    }
}
