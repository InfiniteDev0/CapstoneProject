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
import java.time.YearMonth;
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
        model.addAttribute("form", new CheckoutForm(user.getName(), "", user.getCity(), user.getCountry(), user.getName(), "", "", "", ""));
        return "shop/checkout";
    }

    /**
     * The checkout form. Payment runs in TEST MODE (the spec asks for a simulated checkout):
     * the card is checked like a real one (number, expiry, CVC) but nothing is charged,
     * and only the last 4 digits are saved. Expiry and CVC are never stored.
     */
    public record CheckoutForm(String shippingName, String shippingAddress, String shippingCity, String shippingCountry,
            String cardName, String cardNumber, String cardExpiry, String cardCvc, String discountCode) {
    }

    /** Checks the card like a real form would and returns its last 4 digits. */
    static String checkCard(CheckoutForm form) {
        if (form.cardName() == null || form.cardName().isBlank()) {
            throw ApiException.badRequest("Please enter the name on the card");
        }
        String digits = form.cardNumber() == null ? "" : form.cardNumber().replaceAll("\\D", "");
        if (digits.length() < 12 || digits.length() > 19 || !luhn(digits)) {
            throw ApiException.badRequest("Your card number is not valid. In test mode, use 4242 4242 4242 4242");
        }
        String expiry = form.cardExpiry() == null ? "" : form.cardExpiry().trim();
        if (!expiry.matches("(0[1-9]|1[0-2])/\\d{2}")) {
            throw ApiException.badRequest("Please enter the expiry date as MM/YY");
        }
        YearMonth exp = YearMonth.of(2000 + Integer.parseInt(expiry.substring(3)), Integer.parseInt(expiry.substring(0, 2)));
        if (exp.isBefore(YearMonth.now())) {
            throw ApiException.badRequest("This card has expired");
        }
        if (form.cardCvc() == null || !form.cardCvc().trim().matches("\\d{3,4}")) {
            throw ApiException.badRequest("Please enter the 3 or 4 digit security code (CVC)");
        }
        return digits.substring(digits.length() - 4);
    }

    /** The Luhn checksum every real card number passes (it catches typos). */
    static boolean luhn(String digits) {
        int sum = 0;
        boolean twice = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int d = digits.charAt(i) - '0';
            if (twice) {
                d *= 2;
                if (d > 9) d -= 9;
            }
            sum += d;
            twice = !twice;
        }
        return sum % 10 == 0;
    }

    @PostMapping("/checkout")
    public String placeOrder(CheckoutForm form, @AuthenticationPrincipal AuthUser me, HttpServletRequest request, Model model) {
        try {
            String last4 = checkCard(form);
            CheckoutRequest req = forms.check(new CheckoutRequest(form.shippingName(), form.shippingAddress(),
                    form.shippingCity(), form.shippingCountry(), PaymentMethod.CARD, last4,
                    form.discountCode() == null || form.discountCode().isBlank() ? null : form.discountCode().trim()));
            OrderResponse order = checkout.checkout(me.id(), req, request.getHeader(HttpHeaders.USER_AGENT));
            return "redirect:/checkout/confirmation/" + order.id();
        } catch (ApiException e) {
            CartResponse bag = cart.view(me.id());
            if (bag.items().isEmpty()) return "redirect:/cart";
            model.addAttribute("bag", bag);
            model.addAttribute("form", new CheckoutForm(form.shippingName(), form.shippingAddress(), form.shippingCity(),
                    form.shippingCountry(), form.cardName(), "", "", "", form.discountCode()));
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
