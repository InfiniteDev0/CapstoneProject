package com.luxuryshop.api.repository.mongo;

import com.luxuryshop.api.model.document.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CategoryRepository extends MongoRepository<Category, String> {

    List<Category> findAllByOrderByDisplayOrderAsc();

    Optional<Category> findBySlug(String slug);
}
