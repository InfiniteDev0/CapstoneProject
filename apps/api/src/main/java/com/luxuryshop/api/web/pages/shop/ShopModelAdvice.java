package com.luxuryshop.api.web.pages.shop;

import com.luxuryshop.api.dto.user.UserResponse;
import com.luxuryshop.api.repository.jpa.CartItemRepository;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.CatalogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/**
 * What every shop page needs for its navbar: the categories, who is signed in,
 * and how many pieces are in their bag.
 */
@ControllerAdvice(basePackages = "com.luxuryshop.api.web.pages.shop")
@RequiredArgsConstructor
public class ShopModelAdvice {

    private final CatalogService catalog;
    private final UserRepository users;
    private final CartItemRepository cart;

    @ModelAttribute
    public void navbar(Model model, @AuthenticationPrincipal AuthUser me, HttpServletRequest request) {
        model.addAttribute("path", request.getRequestURI());
        model.addAttribute("navCategories", catalog.categories());
        if (me != null) {
            model.addAttribute("me", users.findById(me.id()).map(UserResponse::from).orElse(null));
            model.addAttribute("bagCount", cart.countPieces(me.id()));
        } else {
            model.addAttribute("bagCount", 0L);
        }
    }
}
