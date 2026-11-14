package com.luxuryshop.api.controller;

import com.luxuryshop.api.dto.wishlist.WishlistItemResponse;
import com.luxuryshop.api.dto.wishlist.WishlistRequest;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Tag(name = "4. Wishlist")
public class WishlistController {

    private final WishlistService wishlist;

    @GetMapping
    @Operation(summary = "My hearted products")
    public List<WishlistItemResponse> list(@AuthenticationPrincipal AuthUser me) {
        return wishlist.list(me.id());
    }

    @PostMapping
    @Operation(summary = "Heart a product (adding twice is fine)")
    public List<WishlistItemResponse> add(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody WishlistRequest request) {
        return wishlist.add(me.id(), request.productId());
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Un-heart a product")
    public void remove(@AuthenticationPrincipal AuthUser me, @PathVariable String productId) {
        wishlist.remove(me.id(), productId);
    }
}
