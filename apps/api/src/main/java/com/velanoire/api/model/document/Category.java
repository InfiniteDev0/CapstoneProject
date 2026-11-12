package com.velanoire.api.model.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** A shop category: abaya, perfume, handbag, bracelet, shayla, shoes, accessory. */
@Document("categories")
@Getter
@Setter
@NoArgsConstructor
public class Category {

    @Id
    private String id;

    private String slug;
    private String name;
    private String description;
    private String image;
    private Integer displayOrder;
}
