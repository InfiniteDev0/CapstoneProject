package com.luxuryshop.api.web.pages.shop;

import com.luxuryshop.api.dto.catalog.ProductSummary;
import com.luxuryshop.api.dto.review.ReviewRequest;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.document.EventType;
import com.luxuryshop.api.model.document.Product;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.CatalogService;
import com.luxuryshop.api.service.ClickstreamService;
import com.luxuryshop.api.service.ReviewService;
import com.luxuryshop.api.service.WishlistService;
import com.luxuryshop.api.web.Forms;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * The product page (the Under-Armour "Products" page): photo + heart, stock dot,
 * price and stars, sizes, colours, specs, Add to Bag, reviews and Related Products.
 * Opening it logs a VIEW click for the recommender.
 */
@Controller
@RequiredArgsConstructor
public class ProductPageController {

    private final CatalogService catalog;
    private final ReviewService reviews;
    private final ClickstreamService clickstream;
    private final WishlistService wishlist;
    private final Forms forms;

    @GetMapping("/product/{slug}")
    public String product(@PathVariable String slug, @AuthenticationPrincipal AuthUser me, Model model) {
        Product p = catalog.bySlug(slug);
        Product.ProductVariant chosen = p.getVariants().stream().filter(v -> Boolean.TRUE.equals(v.getIsDefault()))
                .findFirst().orElse(p.getVariants().isEmpty() ? null : p.getVariants().get(0));

        List<ProductSummary> related = catalog.search(CatalogPageController.filter(p.getCategory(), p.getSubCategory(),
                null, null, null, null, null, null, "popular", 0, 9)).items().stream()
                .filter(s -> !s.id().equals(p.getId())).limit(8).toList();

        clickstream.logPageEvent(me == null ? null : me.id(), EventType.VIEW, p.getId(), p.getCategory(), null);

        model.addAttribute("product", p);
        model.addAttribute("summary", ProductSummary.from(p));
        model.addAttribute("chosen", chosen);
        model.addAttribute("related", related);
        model.addAttribute("reviews", reviews.list(p.getId(), 0, 10));
        model.addAttribute("likedIds", wishlist.likedIds(me == null ? null : me.id()));
        return "shop/product";
    }

    @PostMapping("/product/{slug}/reviews")
    public String review(@PathVariable String slug, @ModelAttribute ReviewRequest form,
            @AuthenticationPrincipal AuthUser me, RedirectAttributes flash) {
        Product p = catalog.bySlug(slug);
        try {
            reviews.add(me.id(), p.getId(), forms.check(form));
            flash.addFlashAttribute("toast", "Thank you for your review");
        } catch (ApiException e) {
            flash.addFlashAttribute("toast", e.getMessage());
            flash.addFlashAttribute("toastType", "error");
        }
        return "redirect:/product/" + slug + "#reviews";
    }
}
