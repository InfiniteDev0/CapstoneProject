package com.velanoire.api.repository.mongo;

import com.velanoire.api.model.document.ClickstreamEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ClickstreamRepository extends MongoRepository<ClickstreamEvent, String> {
}
