package com.velanoire.api.repository.mongo;

import com.velanoire.api.model.document.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

/** Saves reviews; reading them by product uses MongoTemplate (ReviewService) for the ObjectId lookup. */
public interface ReviewRepository extends MongoRepository<Review, String> {
}
