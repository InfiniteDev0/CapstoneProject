package com.velanoire.api.repository.mongo;

import com.velanoire.api.model.document.ProductCollection;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CollectionRepository extends MongoRepository<ProductCollection, String> {

    boolean existsBySlug(String slug);
}
