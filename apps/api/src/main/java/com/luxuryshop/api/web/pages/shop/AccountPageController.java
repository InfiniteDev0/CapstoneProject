package com.luxuryshop.api.web.pages.shop;

import com.luxuryshop.api.dto.user.UpdateProfileRequest;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.entity.Gender;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.OrderService;
import com.luxuryshop.api.service.ProfileService;
import com.luxuryshop.api.service.WishlistService;
import com.luxuryshop.api.web.Forms;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * My account (the Under-Armour "Profile" page), my orders, and my liked items.
 * The profile keeps what the spec asks for: demographics, tenure, devices, preferred categories.
 */
@Controller
@RequiredArgsConstructor
public class AccountPageController {

    private final ProfileService profiles;
    private final OrderService orders;
    private final WishlistService wishlist;
    private final Forms forms;

    @GetMapping("/account")
    public String account(@AuthenticationPrincipal AuthUser me, Model model) {
        model.addAttribute("profile", profiles.get(me.id()));
        model.addAttribute("recentOrders", orders.myOrders(me.id(), 0, 3).items());
        model.addAttribute("genders", Gender.values());
        return "shop/account";
    }

    /** The edit-profile form. */
    public record ProfileForm(String name, String phone, String country, String city, Gender gender,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateOfBirth, List<String> preferredCategories) {
    }

    @PostMapping("/account")
    public String save(ProfileForm form, @AuthenticationPrincipal AuthUser me, RedirectAttributes flash) {
        try {
            profiles.update(me.id(), forms.check(new UpdateProfileRequest(
                    form.name() == null ? null : form.name().trim(), emptyToNull(form.phone()), emptyToNull(form.country()),
                    emptyToNull(form.city()), form.gender(), form.dateOfBirth(),
                    form.preferredCategories() == null ? List.of() : form.preferredCategories())));
            flash.addFlashAttribute("toast", "Profile saved");
        } catch (ApiException e) {
            flash.addFlashAttribute("toast", e.getMessage());
            flash.addFlashAttribute("toastType", "error");
        }
        return "redirect:/account";
    }

    @GetMapping("/account/orders")
    public String myOrders(@RequestParam(defaultValue = "0") int page, @AuthenticationPrincipal AuthUser me, Model model) {
        model.addAttribute("orders", orders.myOrders(me.id(), Math.max(page, 0), 10));
        return "shop/orders";
    }

    @GetMapping("/account/orders/{id}")
    public String myOrder(@PathVariable Long id, @AuthenticationPrincipal AuthUser me, Model model) {
        model.addAttribute("order", orders.myOrder(me.id(), id));
        return "shop/order";
    }

    @GetMapping("/liked")
    public String liked(@AuthenticationPrincipal AuthUser me, Model model) {
        model.addAttribute("items", wishlist.list(me.id()));
        return "shop/liked";
    }

    @PostMapping("/liked/{productId}/remove")
    public String unlike(@PathVariable String productId, @AuthenticationPrincipal AuthUser me, RedirectAttributes flash) {
        wishlist.remove(me.id(), productId);
        flash.addFlashAttribute("toast", "Removed from your favourites");
        return "redirect:/liked";
    }

    private static String emptyToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
