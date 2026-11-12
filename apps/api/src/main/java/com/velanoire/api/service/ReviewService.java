package com.velanoire.api.service;

import com.velanoire.api.dto.common.PageResponse;
import com.velanoire.api.dto.review.ReviewRequest;
import com.velanoire.api.dto.review.ReviewResponse;
import com.velanoire.api.exception.ApiException;
import com.velanoire.api.model.document.Product;
import com.velanoire.api.model.document.Review;
import com.velanoire.api.model.entity.User;
import com.velanoire.api.repository.jpa.OrderItemRepository;
import com.velanoire.api.repository.jpa.UserRepository;
import com.velanoire.api.repository.mongo.ReviewRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

/**
 * Star ratings. A review lives in MongoDB, its author in MySQL (users.id), and
 * "verified purchase" is checked against MySQL orders: one feature, both databases.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final MongoTemplate mongo;
    private final ReviewRepository reviews;
    private final CatalogService catalog;
    private final UserRepository users;
    private final OrderItemRepository orderItems;

    public PageResponse<ReviewResponse> list(String productId, int page, int size) {
        catalog.requireVisible(productId);
        Query query = Query.query(Criteria.where("productId").is(new ObjectId(productId)));
        long total = mongo.count(query, Review.class);
        query.with(Sort.by(Sort.Direction.DESC, "createdAt")).skip((long) page * size).limit(size);
        List<ReviewResponse> items = mongo.find(query, Review.class).stream().map(ReviewResponse::from).toList();
        return PageResponse.of(items, page, size, total);
    }

    public ReviewResponse add(Long userId, String productId, ReviewRequest req) {
        Product product = catalog.requireVisible(productId);
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));

        Review review = new Review();
        review.setProductId(product.getId());
        review.setUserId(userId);
        review.setUserName(displayName(user.getName()));
        review.setRating(req.rating());
        review.setTitle(trimToNull(req.title()));
        review.setComment(trimToNull(req.comment()));
        review.setVerifiedPurchase(orderItems.hasPurchased(userId, productId));
        review.setCreatedAt(Instant.now());
        try {
            reviews.insert(review);
        } catch (DuplicateKeyException e) {
            // The unique index (productId + userId) allows one review per customer per product
            throw ApiException.conflict("You have already reviewed this product");
        }
        refreshRatingSummary(productId);
        return ReviewResponse.from(review);
    }

    /** Recount the stars and save the average on the product, so product cards don't add them up each time. */
    void refreshRatingSummary(String productId) {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("productId").is(new ObjectId(productId))),
                Aggregation.group().avg("rating").as("average").count().as("count"));
        Document result = mongo.aggregate(agg, "reviews", Document.class).getUniqueMappedResult();
        double average = result == null ? 0 : Math.round(result.get("average", Number.class).doubleValue() * 10) / 10.0;
        int count = result == null ? 0 : result.get("count", Number.class).intValue();
        mongo.updateFirst(Query.query(Criteria.where("_id").is(new ObjectId(productId))),
                new Update().set("ratings.average", average).set("ratings.count", count).set("updatedAt", Instant.now()),
                Product.class);
    }

    /** "Amira Hassan" becomes "Amira H." on the product page. */
    static String displayName(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        return parts.length == 1 ? parts[0] : parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
