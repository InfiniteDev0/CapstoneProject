package com.luxuryshop.api.model.document;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** A shop category (men, women, shoes) with its subcategories (topwear, running...), in menu order. */
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
    private List<SubCategory> subCategories = new ArrayList<>();

    /** e.g. { slug: "outerwear", name: "Outerwear" } */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class SubCategory {
        private String slug;
        private String name;
    }
}
