package com.luxuryshop.api.model.document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
 * category is men | women | shoes; subCategory is topwear | bottomwear | outerwear | accessories
 * (men, women) or running | training | lifestyle (shoes).
 * sizes are what the shopper picks from (empty = one size). Stock is counted per colour variant.
 * attributes is a free list of specs shown on the product page, e.g. material, fit, care.
 *
 * Booleans are Boolean (not boolean) so their JSON names stay "isNew", "isBestSeller".
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
    private String category;
    private String subCategory;

    /** Stored as Decimal128 (exact money), never as a string or a double. */
    @Field(targetType = FieldType.DECIMAL128)
    private BigDecimal basePrice;

    private Integer discountPercent = 0;
    private String status = "LIVE";
    private Boolean isNew = false;
    private Boolean isBestSeller = false;

    private List<String> tags = new ArrayList<>();
    private List<String> images = new ArrayList<>();
    private List<String> sizes = new ArrayList<>();
    private Map<String, String> attributes = new LinkedHashMap<>();
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
    public static class ProductRatings {
        private Double average = 0.0;
        private Integer count = 0;
    }
}
