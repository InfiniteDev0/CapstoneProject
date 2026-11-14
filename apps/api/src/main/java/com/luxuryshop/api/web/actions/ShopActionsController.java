package com.luxuryshop.api.web.actions;

import com.luxuryshop.api.dto.cart.AddToCartRequest;
import com.luxuryshop.api.dto.cart.CartResponse;
import com.luxuryshop.api.repository.jpa.WishlistItemRepository;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.CartService;
import com.luxuryshop.api.service.WishlistService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The small fetch() calls the shop pages make without reloading: add to bag, change a
 * quantity, remove a line, like / unlike. Same services as the REST API, but logged in
 * by the web session (and protected by the CSRF token the page sends in a header).
 * Errors come back as { error, message, status } so shop.js can show the message in a toast.
 */
@RestController
@RequestMapping("/web")
@RequiredArgsConstructor
public class ShopActionsController {

    private final CartService cart;
    private final WishlistService wishlist;
    private final WishlistItemRepository likes;

    @PostMapping("/cart")
    public Map<String, Object> add(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody AddToCartRequest req) {
        return bagSummary(cart.add(me.id(), req));
    }

    public record QuantityRequest(@Min(1) @Max(20) int quantity) {
    }

    @PatchMapping("/cart/{itemId}")
    public Map<String, Object> quantity(@AuthenticationPrincipal AuthUser me, @PathVariable Long itemId,
            @Valid @RequestBody QuantityRequest req) {
        return bagSummary(cart.updateQuantity(me.id(), itemId, req.quantity()));
    }

    @DeleteMapping("/cart/{itemId}")
    public Map<String, Object> remove(@AuthenticationPrincipal AuthUser me, @PathVariable Long itemId) {
        return bagSummary(cart.remove(me.id(), itemId));
    }

    /** Heart button: likes the product, or unlikes it if it was already liked. */
    @PostMapping("/likes/{productId}")
    public Map<String, Object> toggleLike(@AuthenticationPrincipal AuthUser me, @PathVariable String productId) {
        boolean liked = likes.findByUserIdAndProductId(me.id(), productId).isPresent();
        if (liked) {
            wishlist.remove(me.id(), productId);
        } else {
            wishlist.add(me.id(), productId);
        }
        return Map.of("liked", !liked);
    }

    private static Map<String, Object> bagSummary(CartResponse bag) {
        return Map.of("count", bag.itemCount(), "subtotal", bag.subtotal(), "shipping", bag.shippingFee(), "total", bag.total());
    }
}
