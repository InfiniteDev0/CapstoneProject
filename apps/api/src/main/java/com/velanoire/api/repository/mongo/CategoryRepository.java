package com.velanoire.api.repository.mongo;

import com.velanoire.api.model.document.Category;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CategoryRepository extends MongoRepository<Category, String> {

    List<Category> findAllByOrderByDisplayOrderAsc();

    boolean existsBySlug(String slug);
}
