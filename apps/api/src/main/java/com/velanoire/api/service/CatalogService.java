package com.velanoire.api.service;

import com.velanoire.api.dto.catalog.ProductFilter;
import com.velanoire.api.dto.catalog.ProductSummary;
import com.velanoire.api.dto.common.PageResponse;
import com.velanoire.api.exception.ApiException;
import com.velanoire.api.model.document.Category;
import com.velanoire.api.model.document.Product;
import com.velanoire.api.model.document.ProductCollection;
import com.velanoire.api.repository.mongo.CategoryRepository;
import com.velanoire.api.repository.mongo.CollectionRepository;
import com.velanoire.api.repository.mongo.ProductRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.bson.types.Decimal128;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.data.mongodb.core.query.TextQuery;
import org.springframework.stereotype.Service;

/**
 * The chef for the catalogue (MongoDB). Browsing builds one query from the filters;
 * MongoDB's indexes (category+price, tags, the text index) keep it fast.
 */
@Service
@RequiredArgsConstructor
public class CatalogService {

    /** What shoppers can see. IN_PRODUCTION / READY_TO_LAUNCH / DISCONTINUED stay hidden. */
    public static final List<String> VISIBLE = List.of("LIVE", "SOLD_OUT");

    private final MongoTemplate mongo;
    private final ProductRepository products;
    private final CategoryRepository categories;
    private final CollectionRepository collections;

    public PageResponse<ProductSummary> search(ProductFilter f) {
        List<Criteria> rules = new ArrayList<>();
        rules.add(Criteria.where("status").in(VISIBLE));
        if (notBlank(f.category())) rules.add(Criteria.where("category").is(f.category().trim().toLowerCase(Locale.ROOT)));
        if (notBlank(f.collection())) rules.add(Criteria.where("collection").is(f.collection().trim().toLowerCase(Locale.ROOT)));
        if (notBlank(f.season())) rules.add(Criteria.where("season").is(f.season().trim().toUpperCase(Locale.ROOT)));
        if (notBlank(f.seasonalLine())) rules.add(Criteria.where("seasonalLine").is(f.seasonalLine().trim()));
        if (f.tags() != null && !f.tags().isEmpty()) rules.add(Criteria.where("tags").all(f.tags()));
        if (f.minPrice() != null || f.maxPrice() != null) {
            Criteria price = Criteria.where("basePrice");
            if (f.minPrice() != null) price = price.gte(new Decimal128(f.minPrice()));
            if (f.maxPrice() != null) price = price.lte(new Decimal128(f.maxPrice()));
            rules.add(price);
        }
        Criteria all = new Criteria().andOperator(rules);

        boolean hasText = notBlank(f.q());
        int page = f.pageOrDefault();
        int size = f.sizeOrDefault();

        Query query = hasText ? TextQuery.queryText(TextCriteria.forDefaultLanguage().matching(f.q().trim())) : new Query();
        query.addCriteria(all);
        Query countQuery = Query.of(query);

        String sort = f.sort() == null ? (hasText ? "relevance" : "newest") : f.sort();
        if (hasText && sort.equals("relevance")) {
            ((TextQuery) query).sortByScore();
        } else {
            query.with(sortFor(sort));
        }
        query.with(PageRequest.of(page, size));

        List<ProductSummary> items = mongo.find(query, Product.class).stream().map(ProductSummary::from).toList();
        long total = mongo.count(countQuery, Product.class);
        return PageResponse.of(items, page, size, total);
    }

    private static Sort sortFor(String sort) {
        return switch (sort) {
            case "price_asc" -> Sort.by(Sort.Order.asc("basePrice"), Sort.Order.asc("_id"));
            case "price_desc" -> Sort.by(Sort.Order.desc("basePrice"), Sort.Order.asc("_id"));
            case "rating" -> Sort.by(Sort.Order.desc("ratings.average"), Sort.Order.desc("ratings.count"), Sort.Order.asc("_id"));
            case "popular" -> Sort.by(Sort.Order.desc("isBestSeller"), Sort.Order.desc("ratings.count"), Sort.Order.asc("_id"));
            case "newest", "relevance" -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("_id"));
            default -> throw ApiException.badRequest(
                    "sort must be one of: newest, price_asc, price_desc, rating, popular, relevance");
        };
    }

    /** The product page. */
    public Product bySlug(String slug) {
        return products.findBySlug(slug)
                .filter(p -> VISIBLE.contains(p.getStatus()))
                .orElseThrow(() -> ApiException.notFound("No product called '" + slug + "'"));
    }

    /** Any shopper-visible product by id (wishlist, reviews). */
    public Product requireVisible(String productId) {
        return products.findById(productId)
                .filter(p -> VISIBLE.contains(p.getStatus()))
                .orElseThrow(() -> ApiException.notFound("Product not found"));
    }

    /** A product that can go in the bag right now (LIVE, not sold out or hidden). */
    public Product requireBuyable(String productId) {
        Product p = products.findById(productId).orElseThrow(() -> ApiException.notFound("Product not found"));
        if (!"LIVE".equals(p.getStatus())) {
            throw ApiException.conflict(p.getName() + " is not available to buy right now");
        }
        return p;
    }

    public List<Category> categories() {
        return categories.findAllByOrderByDisplayOrderAsc();
    }

    public List<ProductCollection> collections() {
        return collections.findAll(Sort.by("name"));
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
