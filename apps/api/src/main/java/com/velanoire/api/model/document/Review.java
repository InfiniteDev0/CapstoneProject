package com.velanoire.api.model.document;

import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/** A star rating and comment. userId points at MySQL users.id (no cross-database key: Java checks). */
@Document("reviews")
@Getter
@Setter
@NoArgsConstructor
public class Review {

    @Id
    private String id;

    /** Stored as an ObjectId in MongoDB, handled as a hex string in Java. */
    @Field(targetType = FieldType.OBJECT_ID)
    private String productId;

    private Long userId;
    private String userName;
    private Integer rating;
    private String title;
    private String comment;
    private Boolean verifiedPurchase = false;
    private Instant createdAt;
}
