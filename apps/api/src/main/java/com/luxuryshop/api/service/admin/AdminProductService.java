package com.luxuryshop.api.service.admin;

import com.luxuryshop.api.dto.admin.AdminProductRow;
import com.luxuryshop.api.dto.admin.InventoryRow;
import com.luxuryshop.api.dto.admin.ProductRequest;
import com.luxuryshop.api.dto.admin.VariantRequest;
import com.luxuryshop.api.dto.admin.VariantUpdateRequest;
import com.luxuryshop.api.dto.common.PageResponse;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.document.Category;
import com.luxuryshop.api.model.document.Product;
import com.luxuryshop.api.repository.jpa.CartItemRepository;
import com.luxuryshop.api.repository.jpa.WishlistItemRepository;
import com.luxuryshop.api.repository.mongo.CategoryRepository;
import com.luxuryshop.api.repository.mongo.ProductRepository;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The manager's catalogue work (MongoDB): add, edit and remove products, their colours and stock.
 * MongoDB's validator double-checks every write (database/mongodb/schemas/products.json).
 */
@Service
@RequiredArgsConstructor
public class AdminProductService {

    private final MongoTemplate mongo;
    private final ProductRepository products;
    private final CategoryRepository categories;
    private final CartItemRepository cartItems;
    private final WishlistItemRepository wishlistItems;

    public PageResponse<AdminProductRow> list(String q, String category, String subCategory, String status, int page, int size) {
        List<Criteria> rules = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            String text = Pattern.quote(q.trim());
            rules.add(new Criteria().orOperator(Criteria.where("name").regex(text, "i"), Criteria.where("variants.sku").regex(text, "i")));
        }
        if (category != null && !category.isBlank()) rules.add(Criteria.where("category").is(category));
        if (subCategory != null && !subCategory.isBlank()) rules.add(Criteria.where("subCategory").is(subCategory));
        if (status != null && !status.isBlank()) rules.add(Criteria.where("status").is(status));
        Query query = rules.isEmpty() ? new Query() : Query.query(new Criteria().andOperator(rules));
        long total = mongo.count(query, Product.class);
        query.with(PageRequest.of(page, size, Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.asc("name"))));
        return PageResponse.of(mongo.find(query, Product.class).stream().map(AdminProductRow::from).toList(), page, size, total);
    }

    public Product get(String id) {
        return products.findById(id).orElseThrow(() -> ApiException.notFound("Product not found"));
    }

    public Product create(ProductRequest req) {
        Product p = new Product();
        p.setRatings(new Product.ProductRatings());
        p.setCreatedAt(Instant.now());
        apply(p, req);
        if (products.existsBySlug(p.getSlug())) {
            throw ApiException.conflict("Another product already uses the slug '" + p.getSlug() + "'");
        }
        return saveChecked(p);
    }

    /** Replace a product's details and colours (PUT). Its id, reviews and created date stay. */
    public Product update(String id, ProductRequest req) {
        Product p = get(id);
        String oldSlug = p.getSlug();
        apply(p, req);
        if (!p.getSlug().equals(oldSlug) && products.existsBySlug(p.getSlug())) {
            throw ApiException.conflict("Another product already uses the slug '" + p.getSlug() + "'");
        }
        return saveChecked(p);
    }

    /**
     * Delete a product, and clean up what pointed at it: its reviews (MongoDB) and any bag or wishlist rows (MySQL).
     * There's no foreign key across databases, so this tidy-up IS the "ON DELETE CASCADE".
     * Old orders keep their snapshot, so receipts are untouched.
     */
    @Transactional
    public void delete(String id) {
        Product p = get(id);
        mongo.remove(Query.query(Criteria.where("productId").is(new ObjectId(p.getId()))), "reviews");
        products.delete(p);
        cartItems.deleteByProductId(p.getId());
        wishlistItems.deleteByProductId(p.getId());
    }

    public Product addVariant(String id, VariantRequest req) {
        Product p = get(id);
        if (p.variant(req.sku()) != null) {
            throw ApiException.conflict("This product already has a colour " + req.sku());
        }
        Product.ProductVariant v = toVariant(req);
        if (Boolean.TRUE.equals(v.getIsDefault())) p.getVariants().forEach(other -> other.setIsDefault(false));
        p.getVariants().add(v);
        return saveChecked(p);
    }

    public Product updateVariant(String id, String sku, VariantUpdateRequest req) {
        Product p = get(id);
        Product.ProductVariant v = requireVariant(p, sku);
        if (req.colorName() != null) v.setColorName(req.colorName().trim());
        if (req.colorHex() != null) v.setColorHex(req.colorHex());
        if (req.stock() != null) v.setStock(req.stock());
        if (Boolean.TRUE.equals(req.clearPriceOverride())) v.setPriceOverride(null);
        else if (req.priceOverride() != null) v.setPriceOverride(req.priceOverride());
        if (req.images() != null) v.setImages(new ArrayList<>(req.images()));
        if (Boolean.TRUE.equals(req.isDefault())) {
            p.getVariants().forEach(other -> other.setIsDefault(other == v));
        }
        return saveChecked(p);
    }

    public Product removeVariant(String id, String sku) {
        Product p = get(id);
        Product.ProductVariant v = requireVariant(p, sku);
        if (p.getVariants().size() == 1) {
            throw ApiException.badRequest("A product needs at least one colour. Delete the product instead.");
        }
        p.getVariants().remove(v);
        if (p.getVariants().stream().noneMatch(x -> Boolean.TRUE.equals(x.getIsDefault()))) {
            p.getVariants().get(0).setIsDefault(true);
        }
        return saveChecked(p);
    }

    /** Replace the product's photo list (the admin uploads, removes or reorders photos). The first is the cover. */
    public Product setImages(String id, List<String> images) {
        if (images.size() > 12) throw ApiException.badRequest("A product can have at most 12 photos");
        mongo.updateFirst(Query.query(Criteria.where("_id").is(new ObjectId(id))),
                new Update().set("images", new ArrayList<>(images)).set("updatedAt", Instant.now()), Product.class);
        return get(id);
    }

    /** Set the shelf count with one atomic update, so it can't clash with a checkout happening at the same moment. */
    public Product setStock(String id, String sku, int stock) {
        Product p = get(id);
        requireVariant(p, sku);
        mongo.updateFirst(Query.query(Criteria.where("_id").is(new ObjectId(id)).and("variants.sku").is(sku)),
                new Update().set("variants.$.stock", stock).set("updatedAt", Instant.now()), Product.class);
        return get(id);
    }

    /** Every colour of every product, lowest stock first; optionally only those at or below `atOrBelow`. */
    public List<InventoryRow> inventory(Integer atOrBelow, String category) {
        Query query = category == null || category.isBlank() ? new Query() : Query.query(Criteria.where("category").is(category));
        return mongo.find(query, Product.class).stream()
                .flatMap(p -> p.getVariants().stream().map(v -> new InventoryRow(p.getId(), p.getName(), p.getCategory(),
                        p.getStatus(), v.getSku(), v.getColorName(), v.getColorHex(), v.getStock() == null ? 0 : v.getStock())))
                .filter(r -> atOrBelow == null || r.stock() <= atOrBelow)
                .sorted(Comparator.comparingInt(InventoryRow::stock).thenComparing(InventoryRow::productName))
                .toList();
    }

    // --- helpers -----------------------------------------------------------------

    /** Copy the request onto the product, checking the rules MongoDB can't know (real category and subcategory, sizes). */
    private void apply(Product p, ProductRequest req) {
        String category = req.category().trim().toLowerCase(Locale.ROOT);
        Category cat = categories.findBySlug(category)
                .orElseThrow(() -> ApiException.badRequest("Unknown category '" + req.category() + "'"));
        String subCategory = req.subCategory().trim().toLowerCase(Locale.ROOT);
        if (cat.getSubCategories().stream().noneMatch(s -> s.getSlug().equals(subCategory))) {
            throw ApiException.badRequest(cat.getName() + " has these subcategories: "
                    + String.join(", ", cat.getSubCategories().stream().map(Category.SubCategory::getSlug).toList()));
        }
        List<String> sizes = req.sizes() == null ? new ArrayList<>() : new ArrayList<>(req.sizes().stream().map(String::trim).toList());
        if (new HashSet<>(sizes).size() != sizes.size()) throw ApiException.badRequest("A size is listed twice");

        var skus = new HashSet<String>();
        for (VariantRequest v : req.variants()) {
            if (!skus.add(v.sku())) throw ApiException.badRequest("Colour " + v.sku() + " is listed twice");
        }

        p.setName(req.name().trim());
        p.setSlug(req.slug() != null ? req.slug() : slugify(req.name()));
        p.setDescription(req.description());
        p.setCategory(category);
        p.setSubCategory(subCategory);
        p.setBasePrice(req.basePrice());
        p.setDiscountPercent(req.discountPercent() == null ? 0 : req.discountPercent());
        p.setStatus(req.status() == null ? "IN_PRODUCTION" : req.status());
        p.setIsNew(Boolean.TRUE.equals(req.isNew()));
        p.setIsBestSeller(Boolean.TRUE.equals(req.isBestSeller()));
        p.setTags(req.tags() == null ? new ArrayList<>() : new ArrayList<>(req.tags()));
        p.setImages(req.images() == null ? new ArrayList<>() : new ArrayList<>(req.images()));
        p.setSizes(sizes);
        p.setAttributes(req.attributes() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(req.attributes()));
        List<Product.ProductVariant> variants = new ArrayList<>(req.variants().stream().map(AdminProductService::toVariant).toList());
        if (variants.stream().noneMatch(v -> Boolean.TRUE.equals(v.getIsDefault()))) variants.get(0).setIsDefault(true);
        p.setVariants(variants);
        p.setUpdatedAt(Instant.now());
    }

    private Product saveChecked(Product p) {
        p.setUpdatedAt(Instant.now());
        try {
            return products.save(p);
        } catch (DuplicateKeyException e) {
            throw ApiException.conflict("That SKU or slug is already used by another product");
        }
    }

    private static Product.ProductVariant toVariant(VariantRequest r) {
        Product.ProductVariant v = new Product.ProductVariant();
        v.setSku(r.sku());
        v.setColorName(r.colorName().trim());
        v.setColorHex(r.colorHex());
        v.setStock(r.stock());
        v.setPriceOverride(r.priceOverride());
        v.setImages(r.images() == null ? new ArrayList<>() : new ArrayList<>(r.images()));
        v.setIsDefault(Boolean.TRUE.equals(r.isDefault()));
        return v;
    }

    private static Product.ProductVariant requireVariant(Product p, String sku) {
        Product.ProductVariant v = p.variant(sku);
        if (v == null) throw ApiException.notFound("No colour " + sku + " on " + p.getName());
        return v;
    }

    /** "Aero Knit Tee!" becomes "aero-knit-tee". */
    static String slugify(String name) {
        String plain = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = plain.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (slug.isEmpty()) throw ApiException.badRequest("Please give the product a slug");
        return slug;
    }
}
