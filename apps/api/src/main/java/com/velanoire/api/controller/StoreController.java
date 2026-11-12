package com.velanoire.api.controller;

import com.velanoire.api.dto.catalog.ProductFilter;
import com.velanoire.api.dto.catalog.ProductSummary;
import com.velanoire.api.dto.common.PageResponse;
import com.velanoire.api.dto.review.ReviewRequest;
import com.velanoire.api.dto.review.ReviewResponse;
import com.velanoire.api.model.document.Category;
import com.velanoire.api.model.document.Product;
import com.velanoire.api.model.document.ProductCollection;
import com.velanoire.api.security.AuthUser;
import com.velanoire.api.service.CatalogService;
import com.velanoire.api.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The shop window: browsing is open to everyone (GET /api/store/** is public in SecurityConfig). */
@RestController
@RequestMapping("/api/store")
@RequiredArgsConstructor
@Tag(name = "2. Store", description = "Catalogue, categories, collections and reviews (MongoDB)")
public class StoreController {

    private static final String OBJECT_ID = "^[0-9a-fA-F]{24}$";

    private final CatalogService catalog;
    private final ReviewService reviews;

    @GetMapping("/products")
    @SecurityRequirements
    @Operation(summary = "Browse products with filters, search, sort and pages",
            description = "sort: newest | price_asc | price_desc | rating | popular | relevance (with q). "
                    + "tags can repeat: ?tags=velvet&tags=evening. Pages start at 0.")
    public PageResponse<ProductSummary> products(@ParameterObject ProductFilter filter) {
        return catalog.search(filter);
    }

    @GetMapping("/products/{slug}")
    @SecurityRequirements
    @Operation(summary = "One product: specs, colours with stock, ratings")
    public Product product(@PathVariable String slug) {
        return catalog.bySlug(slug);
    }

    @GetMapping("/categories")
    @SecurityRequirements
    @Operation(summary = "All categories, in menu order")
    public List<Category> categories() {
        return catalog.categories();
    }

    @GetMapping("/collections")
    @SecurityRequirements
    @Operation(summary = "All collections (Seasonal includes its 4 lines)")
    public List<ProductCollection> collections() {
        return catalog.collections();
    }

    @GetMapping("/products/{id}/reviews")
    @SecurityRequirements
    @Operation(summary = "A product's reviews, newest first")
    public PageResponse<ReviewResponse> reviews(
            @PathVariable @Pattern(regexp = OBJECT_ID, message = "must be a product id") String id,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        return reviews.list(id, page, size);
    }

    @PostMapping("/products/{id}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Rate a product 1 to 5 (needs a token; one review per product)")
    public ReviewResponse addReview(
            @AuthenticationPrincipal AuthUser me,
            @PathVariable @Pattern(regexp = OBJECT_ID, message = "must be a product id") String id,
            @Valid @RequestBody ReviewRequest request) {
        return reviews.add(me.id(), id, request);
    }
}
