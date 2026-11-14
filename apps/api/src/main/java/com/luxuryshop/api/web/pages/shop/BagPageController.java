package com.luxuryshop.api.web.pages.shop;

import com.luxuryshop.api.dto.cart.CartResponse;
import com.luxuryshop.api.dto.order.CheckoutRequest;
import com.luxuryshop.api.dto.order.OrderResponse;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.entity.PaymentMethod;
import com.luxuryshop.api.repository.jpa.UserRepository;
import com.luxuryshop.api.security.AuthUser;
import com.luxuryshop.api.service.CartService;
import com.luxuryshop.api.service.CheckoutService;
import com.luxuryshop.api.service.OrderService;
import com.luxuryshop.api.web.Forms;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

/**
 * The bag, the (simulated) checkout and the "thank you" page.
 * Checkout itself is the tested Phase 3 recipe: take stock in MongoDB, write the receipt in MySQL.
 */
@Controller
@RequiredArgsConstructor
public class BagPageController {

    private final CartService cart;
    private final CheckoutService checkout;
    private final OrderService orders;
    private final UserRepository users;
    private final Forms forms;

    @GetMapping("/cart")
    public String bag(@AuthenticationPrincipal AuthUser me, Model model) {
        model.addAttribute("bag", cart.view(me.id()));
        return "shop/cart";
    }

    @GetMapping("/checkout")
    public String checkoutPage(@AuthenticationPrincipal AuthUser me, Model model) {
        CartResponse bag = cart.view(me.id());
        if (bag.items().isEmpty()) return "redirect:/cart";
        var user = users.findById(me.id()).orElseThrow();
        model.addAttribute("bag", bag);
        model.addAttribute("form", new CheckoutForm(user.getName(), "", user.getCity(), user.getCountry(), "", ""));
        return "shop/checkout";
    }

    /** The checkout form. The full card number is only used to read its last 4 digits; it is never saved. */
    public record CheckoutForm(String shippingName, String shippingAddress, String shippingCity, String shippingCountry,
            String cardNumber, String discountCode) {
    }

    @PostMapping("/checkout")
    public String placeOrder(CheckoutForm form, @AuthenticationPrincipal AuthUser me, HttpServletRequest request, Model model) {
        try {
            String digits = form.cardNumber() == null ? "" : form.cardNumber().replaceAll("\\D", "");
            if (digits.length() < 12 || digits.length() > 19) {
                throw ApiException.badRequest("Card number: please enter 12 to 19 digits (this is a simulation, any number works)");
            }
            CheckoutRequest req = forms.check(new CheckoutRequest(form.shippingName(), form.shippingAddress(),
                    form.shippingCity(), form.shippingCountry(), PaymentMethod.CARD, digits.substring(digits.length() - 4),
                    form.discountCode() == null || form.discountCode().isBlank() ? null : form.discountCode().trim()));
            OrderResponse order = checkout.checkout(me.id(), req, request.getHeader(HttpHeaders.USER_AGENT));
            return "redirect:/checkout/confirmation/" + order.id();
        } catch (ApiException e) {
            CartResponse bag = cart.view(me.id());
            if (bag.items().isEmpty()) return "redirect:/cart";
            model.addAttribute("bag", bag);
            model.addAttribute("form", new CheckoutForm(form.shippingName(), form.shippingAddress(), form.shippingCity(),
                    form.shippingCountry(), "", form.discountCode()));
            model.addAttribute("error", e.getMessage());
            return "shop/checkout";
        }
    }

    @GetMapping("/checkout/confirmation/{id}")
    public String confirmation(@PathVariable Long id, @AuthenticationPrincipal AuthUser me, Model model) {
        model.addAttribute("order", orders.myOrder(me.id(), id));
        return "shop/confirmation";
    }
}
