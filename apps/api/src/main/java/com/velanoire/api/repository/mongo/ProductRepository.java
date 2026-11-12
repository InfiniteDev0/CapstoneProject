package com.velanoire.api.repository.mongo;

import com.velanoire.api.model.document.Product;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

/** Storeroom keeper for the "products" shelf in MongoDB. Filtered searches use MongoTemplate (CatalogService). */
public interface ProductRepository extends MongoRepository<Product, String> {

    Optional<Product> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
