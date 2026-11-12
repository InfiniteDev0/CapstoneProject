package com.velanoire.api.controller;

import com.velanoire.api.dto.cart.AddToCartRequest;
import com.velanoire.api.dto.cart.CartResponse;
import com.velanoire.api.dto.cart.UpdateCartItemRequest;
import com.velanoire.api.security.AuthUser;
import com.velanoire.api.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The shopping bag. Every call answers with the whole priced bag, so the page can just redraw it. */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "5. Cart")
public class CartController {

    private final CartService cart;

    @GetMapping
    @Operation(summary = "My bag, priced from the live catalogue")
    public CartResponse view(@AuthenticationPrincipal AuthUser me) {
        return cart.view(me.id());
    }

    @PostMapping("/items")
    @Operation(summary = "Add to bag (checks the product, colour, size and stock first)")
    public CartResponse add(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody AddToCartRequest request) {
        return cart.add(me.id(), request);
    }

    @PatchMapping("/items/{itemId}")
    @Operation(summary = "Change how many of a line")
    public CartResponse update(@AuthenticationPrincipal AuthUser me, @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        return cart.updateQuantity(me.id(), itemId, request.quantity());
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Remove a line from the bag")
    public CartResponse remove(@AuthenticationPrincipal AuthUser me, @PathVariable Long itemId) {
        return cart.remove(me.id(), itemId);
    }

    @DeleteMapping
    @Operation(summary = "Empty the bag")
    public CartResponse clear(@AuthenticationPrincipal AuthUser me) {
        return cart.clear(me.id());
    }
}
