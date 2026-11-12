package com.velanoire.api.model.document;

import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/** One click in the clickstream log: a view, search, cart action or purchase. */
@Document("clickstream_events")
@Getter
@Setter
@NoArgsConstructor
public class ClickstreamEvent {

    @Id
    private String id;

    private Long userId; // MySQL users.id; null for guests
    private String sessionId;
    private EventType type;

    @Field(targetType = FieldType.OBJECT_ID)
    private String productId;

    private String category;
    private String query;
    private Long orderId; // MySQL orders.id, for PURCHASE
    private String device; // DESKTOP | MOBILE | TABLET
    private String page;
    private Instant timestamp;
}
