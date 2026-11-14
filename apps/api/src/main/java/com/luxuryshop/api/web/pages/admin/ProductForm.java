package com.luxuryshop.api.web.pages.admin;

import com.luxuryshop.api.dto.admin.ProductRequest;
import com.luxuryshop.api.dto.admin.VariantRequest;
import com.luxuryshop.api.model.document.Product;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The admin product form as the browser sends it: plain fields, sizes and tags as
 * comma-separated text, specs as name/value rows, and one row per colour.
 * toRequest() turns it into the same ProductRequest the REST API uses.
 */
@Getter
@Setter
@NoArgsConstructor
public class ProductForm {

    private String name;
    private String slug;
    private String description;
    private String category = "men";
    private String subCategory = "topwear";
    private BigDecimal basePrice;
    private Integer discountPercent = 0;
    private String status = "IN_PRODUCTION";
    private boolean newArrival;
    private boolean bestSeller;
    private String sizes = "";
    private String tags = "";
    private List<String> images = new ArrayList<>();
    private List<String> attrNames = new ArrayList<>();
    private List<String> attrValues = new ArrayList<>();
    private List<Colour> variants = new ArrayList<>();
    private int defaultColour;

    /** One colour row. */
    @Getter
    @Setter
    @NoArgsConstructor
    public static class Colour {
        private String sku;
        private String colorName;
        private String colorHex = "#111111";
        private Integer stock = 0;
        private BigDecimal priceOverride;
    }

    public static ProductForm blank() {
        ProductForm f = new ProductForm();
        f.getVariants().add(new Colour());
        f.getAttrNames().addAll(List.of("Material", "Fit"));
        f.getAttrValues().addAll(List.of("", ""));
        return f;
    }

    public static ProductForm from(Product p) {
        ProductForm f = new ProductForm();
        f.name = p.getName();
        f.slug = p.getSlug();
        f.description = p.getDescription();
        f.category = p.getCategory();
        f.subCategory = p.getSubCategory();
        f.basePrice = p.getBasePrice();
        f.discountPercent = p.getDiscountPercent();
        f.status = p.getStatus();
        f.newArrival = Boolean.TRUE.equals(p.getIsNew());
        f.bestSeller = Boolean.TRUE.equals(p.getIsBestSeller());
        f.sizes = String.join(", ", p.getSizes());
        f.tags = String.join(", ", p.getTags());
        f.images = new ArrayList<>(p.getImages());
        p.getAttributes().forEach((k, v) -> {
            f.attrNames.add(k);
            f.attrValues.add(v);
        });
        for (int i = 0; i < p.getVariants().size(); i++) {
            Product.ProductVariant v = p.getVariants().get(i);
            Colour c = new Colour();
            c.sku = v.getSku();
            c.colorName = v.getColorName();
            c.colorHex = v.getColorHex() == null ? "#111111" : v.getColorHex();
            c.stock = v.getStock();
            c.priceOverride = v.getPriceOverride();
            f.variants.add(c);
            if (Boolean.TRUE.equals(v.getIsDefault())) f.defaultColour = i;
        }
        return f;
    }

    public ProductRequest toRequest() {
        Map<String, String> attributes = new LinkedHashMap<>();
        for (int i = 0; i < attrNames.size(); i++) {
            String k = attrNames.get(i) == null ? "" : attrNames.get(i).trim();
            String v = i < attrValues.size() && attrValues.get(i) != null ? attrValues.get(i).trim() : "";
            if (!k.isEmpty() && !v.isEmpty()) attributes.put(k, v);
        }
        List<VariantRequest> colours = new ArrayList<>();
        for (int i = 0; i < variants.size(); i++) {
            Colour c = variants.get(i);
            if (c == null || (blank(c.sku) && blank(c.colorName))) continue; // an empty row the admin didn't fill in
            colours.add(new VariantRequest(c.sku == null ? null : c.sku.trim().toUpperCase(Locale.ROOT),
                    c.colorName == null ? null : c.colorName.trim(), blank(c.colorHex) ? null : c.colorHex.trim(),
                    c.stock, c.priceOverride, List.of(), i == defaultColour));
        }
        return new ProductRequest(
                name == null ? null : name.trim(), blank(slug) ? null : slug.trim(), description,
                category, subCategory, basePrice, discountPercent == null ? 0 : discountPercent, status,
                newArrival, bestSeller, split(tags), images, split(sizes), attributes, colours);
    }

    private static List<String> split(String text) {
        if (text == null || text.isBlank()) return new ArrayList<>();
        return new ArrayList<>(Arrays.stream(text.split(",")).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList());
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
