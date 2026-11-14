package com.luxuryshop.api.web.pages.shop;

import com.luxuryshop.api.dto.catalog.ProductFilter;
import com.luxuryshop.api.dto.catalog.ProductSummary;
import com.luxuryshop.api.dto.common.PageResponse;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.document.Category;
import com.luxuryshop.api.model.document.EventType;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.CatalogService;
import com.luxuryshop.api.service.ClickstreamService;
import com.luxuryshop.api.service.WishlistService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * The home page and the browsing pages (the Under-Armour "Categories" page):
 * /categories/men, /categories/women, /categories/shoes, /categories/new, and /search?q=...
 */
@Controller
@RequiredArgsConstructor
public class CatalogPageController {

    static final int PAGE_SIZE = 24;
    static final List<String> SORTS = List.of("newest", "popular", "price_asc", "price_desc", "rating");

    private final CatalogService catalog;
    private final WishlistService wishlist;
    private final ClickstreamService clickstream;

    @GetMapping("/")
    public String home(@AuthenticationPrincipal AuthUser me, Model model) {
        model.addAttribute("newIn", catalog.search(filter(null, null, true, null, null, null, null, null, "newest", 0, 8)).items());
        model.addAttribute("bestSellers", catalog.search(filter(null, null, null, true, null, null, null, null, "popular", 0, 8)).items());
        model.addAttribute("likedIds", likedIds(me));
        return "shop/home";
    }

    @GetMapping("/shop")
    public String shop() {
        return "redirect:/categories/new";
    }

    @GetMapping("/categories/{slug}")
    public String category(@PathVariable String slug,
            @RequestParam(required = false) String sub,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal AuthUser me, Model model) {
        boolean isNew = "new".equals(slug);
        Category category = isNew ? null : catalog.categories().stream().filter(c -> c.getSlug().equals(slug)).findFirst()
                .orElseThrow(() -> ApiException.notFound("No category called '" + slug + "'"));
        String safeSort = SORTS.contains(sort) ? sort : "newest";
        PageResponse<ProductSummary> results = catalog.search(filter(isNew ? null : slug, blank(sub), isNew ? true : null, null,
                blank(size), minPrice, maxPrice, null, safeSort, Math.max(page, 0), PAGE_SIZE));

        model.addAttribute("slug", slug);
        model.addAttribute("category", category);
        model.addAttribute("heading", isNew ? "New Arrivals" : category.getName());
        model.addAttribute("results", results);
        model.addAttribute("sub", blank(sub));
        model.addAttribute("size", blank(size));
        model.addAttribute("minPrice", minPrice);
        model.addAttribute("maxPrice", maxPrice);
        model.addAttribute("sort", safeSort);
        model.addAttribute("sizeOptions", sizeOptions(slug));
        model.addAttribute("likedIds", likedIds(me));
        return "shop/catalog";
    }

    @GetMapping("/search")
    public String search(@RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "relevance") String sort,
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal AuthUser me, Model model) {
        String query = q.trim();
        PageResponse<ProductSummary> results = query.isEmpty()
                ? PageResponse.of(List.of(), 0, PAGE_SIZE, 0)
                : catalog.search(filter(null, null, null, null, null, null, null, query,
                        SORTS.contains(sort) ? sort : "relevance", Math.max(page, 0), PAGE_SIZE));
        if (!query.isEmpty() && page == 0) {
            clickstream.logPageEvent(me == null ? null : me.id(), EventType.SEARCH, null, null,
                    query.length() > 200 ? query.substring(0, 200) : query);
        }
        model.addAttribute("q", query);
        model.addAttribute("results", results);
        model.addAttribute("sort", sort);
        model.addAttribute("likedIds", likedIds(me));
        return "shop/search";
    }

    private Set<String> likedIds(AuthUser me) {
        return wishlist.likedIds(me == null ? null : me.id());
    }

    static List<String> sizeOptions(String slug) {
        return switch (slug) {
            case "shoes" -> List.of("6", "7", "8", "9", "10", "11", "12");
            case "women" -> List.of("XS", "S", "M", "L", "XL");
            case "men" -> List.of("S", "M", "L", "XL", "XXL");
            default -> List.of("XS", "S", "M", "L", "XL", "XXL");
        };
    }

    static ProductFilter filter(String category, String sub, Boolean isNew, Boolean best, String size,
            BigDecimal min, BigDecimal max, String q, String sort, int page, int pageSize) {
        return new ProductFilter(category, sub, isNew, best, size, min, max, null, q, sort, page, pageSize);
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
