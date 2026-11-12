package com.velanoire.api.model.document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

/**
 * One page of the MongoDB "menu album": a product with its colour variants inside it.
 * Matches database/mongodb/schemas/products.json (the validator rejects anything else).
 *
 * Booleans are Boolean (not boolean) so their JSON names stay "isNew", "isBestSeller"...
 */
@Document("products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    private String id; // the ObjectId as 24 hex characters, e.g. 6750a1000000000000000101

    private String name;
    private String slug;
    private String description;
    private String story;
    private String designer;
    private String category;
    private String collection;
    private String season;
    private String seasonalLine;

    /** Stored as Decimal128 (exact money), never as a string or a double. */
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal basePrice;

    private Integer discountPercent = 0;
    private String status = "LIVE";
    private Boolean isNew = false;
    private Boolean isBestSeller = false;
    private Boolean isLimitedEdition = false;
    private Instant launchDate;
    private Instant releaseDate;
    private List<String> tags = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private AbayaDetails abaya;
    private PerfumeDetails perfume;
    private List<SetItem> setItems;
    private List<ProductVariant> variants = new ArrayList<>();
    private ProductRatings ratings = new ProductRatings();
    private Instant createdAt;
    private Instant updatedAt;

    /** The variant with this SKU, or null. */
    public ProductVariant variant(String sku) {
        return variants.stream().filter(v -> v.getSku().equals(sku)).findFirst().orElse(null);
    }

    public int totalStock() {
        return variants.stream().mapToInt(v -> v.getStock() == null ? 0 : v.getStock()).sum();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ProductVariant {
        private String sku;
        private String colorName;
        private String colorHex;
        private Integer stock = 0;

        @Field(targetType = FieldType.DECIMAL128)
        private BigDecimal priceOverride;

        private List<String> images = new ArrayList<>();
        private Boolean isDefault = false;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class AbayaDetails {
        private String fabric;
        private List<String> styles = new ArrayList<>();
        private List<String> sizes = new ArrayList<>();
        private List<String> lengths = new ArrayList<>();
        private Boolean shaylaIncluded;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class PerfumeDetails {
        private Integer volumeMl;
        private Notes notes;

        @Getter
        @Setter
        @NoArgsConstructor
        public static class Notes {
            private List<String> top = new ArrayList<>();
            private List<String> heart = new ArrayList<>();
            private List<String> base = new ArrayList<>();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class SetItem {
        private String category;
        private String description;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ProductRatings {
        private Double average = 0.0;
        private Integer count = 0;
    }
}
