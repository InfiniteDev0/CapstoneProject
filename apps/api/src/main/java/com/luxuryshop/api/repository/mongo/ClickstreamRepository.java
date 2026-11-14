package com.luxuryshop.api.repository.mongo;

import com.luxuryshop.api.model.document.ClickstreamEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ClickstreamRepository extends MongoRepository<ClickstreamEvent, String> {
}
